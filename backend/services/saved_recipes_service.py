import json
import re

from db import execute, query


MYSQL_TABLE_NOT_FOUND_ERROR = 1146
DEFAULT_SAVED_RECIPE_PAGE = 1
DEFAULT_SAVED_RECIPE_LIMIT = 20
MAX_SAVED_RECIPE_LIMIT = 50


def _parse_positive_integer(value, fallback):
    matched = re.match(r"^\s*(-?\d+)", str(value or ""))
    parsed = int(matched.group(1)) if matched else fallback
    if parsed < 1:
        return fallback
    return parsed


def _normalize_limit(limit_input):
    limit = _parse_positive_integer(limit_input, DEFAULT_SAVED_RECIPE_LIMIT)
    if limit > MAX_SAVED_RECIPE_LIMIT:
        return MAX_SAVED_RECIPE_LIMIT
    return limit


def _normalize_page(page_input):
    return _parse_positive_integer(page_input, DEFAULT_SAVED_RECIPE_PAGE)


def _normalize_images_only(images_only_input):
    text = str(images_only_input or "").strip().lower()
    return text in ("true", "1", "yes", "on")


def _normalize_text(value, max_length=None):
    text = str(value or "").strip()
    if max_length is not None:
        return text[:max_length]
    return text


def _parse_ingredients_json(value):
    if not value:
        return []

    if isinstance(value, (list, dict)):
        return value

    try:
        return json.loads(str(value))
    except (TypeError, ValueError):
        return []


def _normalize_ingredients_json(value):
    if value is None or value == "":
        return json.dumps([], ensure_ascii=False)

    if isinstance(value, (list, dict)):
        return json.dumps(value, ensure_ascii=False)

    try:
        parsed = json.loads(str(value))
        return json.dumps(parsed, ensure_ascii=False)
    except (TypeError, ValueError):
        return json.dumps([str(value)], ensure_ascii=False)


def _extract_recipe_image_url(recipe):
    safe_recipe = recipe if isinstance(recipe, dict) else {}
    candidates = [
        safe_recipe.get("imageUrl"),
        safe_recipe.get("recipeImageUrl"),
        safe_recipe.get("image_url"),
        safe_recipe.get("recipe_image_url"),
        safe_recipe.get("foodImageUrl"),
        safe_recipe.get("mediumImageUrl"),
        safe_recipe.get("smallImageUrl"),
    ]

    for value in candidates:
        image_url = _normalize_text(value, 1000)
        if image_url:
            return image_url

    return ""


def _build_external_recipe_id(recipe):
    safe_recipe = recipe if isinstance(recipe, dict) else {}
    candidates = [
        safe_recipe.get("externalRecipeId"),
        safe_recipe.get("external_recipe_id"),
        safe_recipe.get("recipeId"),
        safe_recipe.get("recipe_id"),
        safe_recipe.get("id"),
        safe_recipe.get("url"),
    ]

    for value in candidates:
        text = _normalize_text(value, 255)
        if text:
            return text

    return ""


def _normalize_source_api(source_api):
    text = _normalize_text(source_api, 50).lower()
    if text:
        return text
    return "database"


def _normalize_recipe_payload(keyword, recipe, source_api):
    safe_recipe = recipe if isinstance(recipe, dict) else {}

    return {
        "keyword": _normalize_text(keyword, 255),
        "source_api": _normalize_source_api(
            safe_recipe.get("sourceApi")
            or safe_recipe.get("source_api")
            or safe_recipe.get("source")
            or source_api
        ),
        "external_recipe_id": _build_external_recipe_id(safe_recipe),
        "recipe_title": _normalize_text(
            safe_recipe.get("title")
            or safe_recipe.get("recipeTitle")
            or safe_recipe.get("recipe_title"),
            255,
        ),
        "recipe_image_url": _extract_recipe_image_url(safe_recipe),
        "recipe_detail_url": _normalize_text(
            safe_recipe.get("url")
            or safe_recipe.get("recipeDetailUrl")
            or safe_recipe.get("recipe_detail_url"),
            1000,
        ),
        "ingredients_json": _normalize_ingredients_json(
            safe_recipe.get("materials")
            or safe_recipe.get("ingredients")
            or safe_recipe.get("recipeMaterial")
        ),
        "estimated_time_ja": _normalize_text(
            safe_recipe.get("time")
            or safe_recipe.get("timeJa")
            or safe_recipe.get("estimatedTimeJa"),
            100,
        ),
        "estimated_cost_ja": _normalize_text(
            safe_recipe.get("cost")
            or safe_recipe.get("costJa")
            or safe_recipe.get("estimatedCostJa"),
            100,
        ),
    }


def _format_saved_recipe(row):
    return {
        "savedRecipeId": row.get("id"),
        "id": row.get("external_recipe_id") or "",
        "userId": row.get("user_id"),
        "keyword": row.get("keyword") or "",
        "sourceApi": row.get("source_api") or "",
        "externalRecipeId": row.get("external_recipe_id") or "",
        "recipeTitle": row.get("recipe_title") or "",
        "recipeImageUrl": row.get("recipe_image_url") or "",
        "recipeDetailUrl": row.get("recipe_detail_url") or "",
        "ingredients": _parse_ingredients_json(row.get("ingredients_json")),
        "estimatedTimeJa": row.get("estimated_time_ja") or "",
        "estimatedCostJa": row.get("estimated_cost_ja") or "",
        "savedAt": row.get("saved_at").isoformat() if row.get("saved_at") else None,
    }


def _is_table_not_found_error(error):
    return getattr(error, "errno", None) == MYSQL_TABLE_NOT_FOUND_ERROR


def user_exists(user_id):
    rows = query(
        """
        SELECT user_id
        FROM users
        WHERE user_id = %s
        LIMIT 1
        """,
        [user_id],
    )
    return bool(rows)


def count_saved_recipes_for_user(user_id, keyword=None, images_only=False):
    conditions = ["user_id = %s"]
    params = [user_id]

    safe_keyword = _normalize_text(keyword, 255)
    if safe_keyword:
        conditions.append("keyword = %s")
        params.append(safe_keyword)

    if bool(images_only):
        conditions.append("COALESCE(recipe_image_url, '') <> ''")

    where_sql = " AND ".join(conditions)

    rows = query(
        f"""
        SELECT COUNT(*) AS total
        FROM user_saved_recipes
        WHERE {where_sql}
        """,
        params,
    )

    return int(rows[0].get("total") or 0) if rows else 0


def list_saved_recipes_for_user(
    user_id,
    keyword=None,
    page_input=None,
    limit_input=None,
    images_only_input=None,
):
    page = _normalize_page(page_input)
    limit = _normalize_limit(limit_input)
    offset = (page - 1) * limit
    images_only = _normalize_images_only(images_only_input)

    conditions = ["user_id = %s"]
    params = [user_id]

    safe_keyword = _normalize_text(keyword, 255)
    if safe_keyword:
        conditions.append("keyword = %s")
        params.append(safe_keyword)

    if images_only:
        conditions.append("COALESCE(recipe_image_url, '') <> ''")

    where_sql = " AND ".join(conditions)

    try:
        count_rows = query(
            f"""
            SELECT COUNT(*) AS total
            FROM user_saved_recipes
            WHERE {where_sql}
            """,
            params,
        )
        total = int(count_rows[0].get("total") or 0) if count_rows else 0

        rows = query(
            f"""
            SELECT
              id,
              user_id,
              keyword,
              source_api,
              external_recipe_id,
              recipe_title,
              recipe_image_url,
              recipe_detail_url,
              ingredients_json,
              estimated_time_ja,
              estimated_cost_ja,
              saved_at
            FROM user_saved_recipes
            WHERE {where_sql}
            ORDER BY saved_at DESC, id DESC
            LIMIT %s OFFSET %s
            """,
            [*params, limit, offset],
        )

        recipes = [_format_saved_recipe(row) for row in rows]

        return 200, {
            "ok": True,
            "userId": user_id,
            "keyword": safe_keyword,
            "imagesOnly": images_only,
            "page": page,
            "limit": limit,
            "total": total,
            "hasMore": offset + len(recipes) < total,
            "recipes": recipes,
        }
    except Exception as error:
        if _is_table_not_found_error(error):
            return 503, {
                "ok": False,
                "message": "保存済みレシピテーブルがまだ作成されていません。",
                "recipes": [],
                "total": 0,
            }

        return 500, {
            "ok": False,
            "message": "保存済みレシピの取得に失敗しました。",
            "recipes": [],
            "total": 0,
        }


def save_recipes_for_user(user_id, keyword, recipes, source_api="database"):
    safe_recipes = recipes if isinstance(recipes, list) else []

    saved_count = 0
    duplicate_count = 0
    error_count = 0
    skipped_invalid_count = 0
    saved_items = []

    for recipe in safe_recipes:
        normalized = _normalize_recipe_payload(keyword, recipe, source_api)

        if not normalized["recipe_title"]:
            skipped_invalid_count += 1
            continue

        if not normalized["external_recipe_id"]:
            skipped_invalid_count += 1
            continue

        try:
            result = execute(
                """
                INSERT INTO user_saved_recipes (
                  user_id,
                  keyword,
                  source_api,
                  external_recipe_id,
                  recipe_title,
                  recipe_image_url,
                  recipe_detail_url,
                  ingredients_json,
                  estimated_time_ja,
                  estimated_cost_ja
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                [
                    user_id,
                    normalized["keyword"],
                    normalized["source_api"],
                    normalized["external_recipe_id"],
                    normalized["recipe_title"],
                    normalized["recipe_image_url"],
                    normalized["recipe_detail_url"],
                    normalized["ingredients_json"],
                    normalized["estimated_time_ja"],
                    normalized["estimated_cost_ja"],
                ],
            )
            saved_count += 1
            saved_items.append(
                {
                    "savedRecipeId": result.get("insert_id"),
                    "externalRecipeId": normalized["external_recipe_id"],
                    "recipeTitle": normalized["recipe_title"],
                }
            )
        except Exception as error:
            errno = getattr(error, "errno", None)

            # Duplicate entry
            if errno == 1062:
                duplicate_count += 1
                continue

            if _is_table_not_found_error(error):
                raise

            error_count += 1

    return {
        "ok": True,
        "userId": user_id,
        "keyword": _normalize_text(keyword, 255),
        "sourceApi": _normalize_source_api(source_api),
        "fetchedCount": len(safe_recipes),
        "savedCount": saved_count,
        "duplicateCount": duplicate_count,
        "skippedInvalidCount": skipped_invalid_count,
        "errorCount": error_count,
        "recipes": saved_items,
    }


def delete_saved_recipe_for_user(user_id, saved_recipe_id):
    safe_id = _parse_positive_integer(saved_recipe_id, 0)
    if safe_id < 1:
        return {
            "status": 400,
            "ok": False,
            "message": "削除対象IDが正しくありません。",
        }

    try:
        result = execute(
            """
            DELETE FROM user_saved_recipes
            WHERE id = %s
              AND user_id = %s
            """,
            [safe_id, user_id],
        )

        if int(result.get("rowcount") or 0) == 0:
            return {
                "status": 404,
                "ok": False,
                "message": "削除対象の保存済みレシピが見つかりません。",
            }

        return {
            "status": 200,
            "ok": True,
            "message": "保存済みレシピを削除しました。",
        }
    except Exception as error:
        if _is_table_not_found_error(error):
            return {
                "status": 503,
                "ok": False,
                "message": "保存済みレシピテーブルがまだ作成されていません。",
            }

        return {
            "status": 500,
            "ok": False,
            "message": "保存済みレシピの削除に失敗しました。",
        }
