import json
import re

from db import query


DEFAULT_LIMIT = 20
MAX_LIMIT = 50


def _parse_non_negative_int(value, fallback):
    matched = re.match(r"^\s*(-?\d+)", str(value or ""))
    parsed = int(matched.group(1)) if matched else fallback
    if parsed < 0:
        return fallback
    return parsed


def _parse_limit(value):
    limit = _parse_non_negative_int(value, DEFAULT_LIMIT)
    if limit < 1:
        return 1
    if limit > MAX_LIMIT:
        return MAX_LIMIT
    return limit


def _escape_like(value):
    return re.sub(r"([\\%_])", r"\\\1", str(value or ""))


def _normalize_materials(value):
    if not value:
        return []

    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]

    try:
        parsed = json.loads(str(value))
    except (TypeError, ValueError):
        return []

    if not isinstance(parsed, list):
        return []

    return [str(item).strip() for item in parsed if str(item).strip()]


def _format_recipe(row):
    return {
        "id": row.get("id"),
        "title": row.get("title") or "",
        "description": row.get("description") or "",
        "imageUrl": row.get("image_url") or "",
        "materials": _normalize_materials(row.get("materials_json")),
        "time": row.get("time_label") or "",
        "cost": row.get("cost_label") or "",
        "difficulty": row.get("difficulty") or "",
        "url": row.get("source_url") or "",
    }


def _build_table_not_ready_response(keyword, limit, offset):
    return {
        "ok": False,
        "provider": "database",
        "keyword": keyword,
        "recipes": [],
        "total": 0,
        "limit": limit,
        "offset": offset,
        "hasMore": False,
        "message": "レシピDBテーブルがまだ作成されていません。",
    }


def search_recipes_from_db(keyword, limit=20, offset=0):
    keyword = str(keyword or "").strip()
    limit_value = _parse_limit(limit)
    offset_value = _parse_non_negative_int(offset, 0)

    if not keyword:
        return {
            "ok": False,
            "provider": "database",
            "keyword": keyword,
            "recipes": [],
            "total": 0,
            "limit": limit_value,
            "offset": offset_value,
            "hasMore": False,
            "message": "keyword を指定してください。",
        }

    like_keyword = f"%{_escape_like(keyword)}%"

    try:
        count_rows = query(
            """
            SELECT COUNT(*) AS total
            FROM recipes
            WHERE title LIKE %s ESCAPE '\\\\'
               OR description LIKE %s ESCAPE '\\\\'
               OR search_text LIKE %s ESCAPE '\\\\'
            """,
            [like_keyword, like_keyword, like_keyword],
        )

        total = int(count_rows[0].get("total") or 0) if count_rows else 0

        rows = query(
            """
            SELECT
              id,
              title,
              description,
              image_url,
              materials_json,
              time_label,
              cost_label,
              difficulty,
              source_url
            FROM recipes
            WHERE title LIKE %s ESCAPE '\\\\'
               OR description LIKE %s ESCAPE '\\\\'
               OR search_text LIKE %s ESCAPE '\\\\'
            ORDER BY updated_at DESC, id DESC
            LIMIT %s OFFSET %s
            """,
            [like_keyword, like_keyword, like_keyword, limit_value, offset_value],
        )

        recipes = [_format_recipe(row) for row in rows]
        next_offset = offset_value + len(recipes)

        return {
            "ok": True,
            "provider": "database",
            "keyword": keyword,
            "recipes": recipes,
            "total": total,
            "limit": limit_value,
            "offset": offset_value,
            "hasMore": next_offset < total,
        }
    except Exception as error:
        error_code = str(getattr(error, "errno", "") or "")
        if error_code == "1146":
            return _build_table_not_ready_response(keyword, limit_value, offset_value)

        message = str(error).lower()
        if "doesn't exist" in message or "does not exist" in message or "1146" in message:
            return _build_table_not_ready_response(keyword, limit_value, offset_value)

        return {
            "ok": False,
            "provider": "database",
            "keyword": keyword,
            "recipes": [],
            "total": 0,
            "limit": limit_value,
            "offset": offset_value,
            "hasMore": False,
            "message": "レシピDB検索に失敗しました。DB設定またはテーブル状態を確認してください。",
        }
