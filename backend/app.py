import os
import re
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from services.auth_service import (
    confirm_password_reset,
    get_current_user_from_token,
    login_user,
    register_user,
    request_password_reset,
)
from services.comunity_list import good_add, good_rem
from services.recipe_db_service import search_recipes_from_db
from services.saved_recipes_service import (
    count_saved_recipes_for_user,
    delete_saved_recipe_for_user,
    list_saved_recipes_for_user,
    save_recipes_for_user,
    user_exists,
)
from services.user_owned_items_service import (
    add_user_owned_item_for_user,
    delete_user_owned_item_for_user,
    list_user_owned_items_for_user,
)
from services.user_profile_service import (
    get_user_profile_for_user,
    update_user_profile_for_user,
)

#追加！！
from db import close_db_resource_safely, execute, get_connection, query, rollback_db_connection_safely
from mysql.connector import Error
from dotenv import load_dotenv
# 環境変数を読み込み
load_dotenv()
#ここまで

#追加6/20
import requests
import time
#08/27
from services.food_evaluation_service import (
    OLLAMA_VISION_MODEL,
    call_ollama,
    default_evaluation,
    extract_json_text,
    normalize_evaluation,
    strip_data_url,
)
from services.menu_proposal_service import (
    MenuProposalError,
    generate_menu_proposal,
)
#ここまで

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"

app = Flask(__name__)


# .env があれば読み込む。未設定でも起動できるようにする。
def load_env():
    env_path = BASE_DIR / ".env"

    try:
        from dotenv import load_dotenv

        load_dotenv(env_path)
        return
    except ImportError:
        pass

    if not env_path.exists():
        return

    for line in env_path.read_text(encoding="utf-8").splitlines():
        trimmed = line.strip()
        if not trimmed or trimmed.startswith("#") or "=" not in trimmed:
            continue

        key, value = trimmed.split("=", 1)
        key = key.strip()
        value = value.strip()

        if (value.startswith('"') and value.endswith('"')) or (
            value.startswith("'") and value.endswith("'")
        ):
            value = value[1:-1]

        os.environ.setdefault(key, value)


load_env()

PORT = int(os.getenv("PORT", "3000") or "3000")
BIND_HOST = "0.0.0.0"

ALLOWED_ORIGINS = {
    "https://mirunavi-frontend.onrender.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5500",
    "http://localhost:5000",
    "http://127.0.0.1:5500",
    "http://localhost:8080"
}
#8080の許可を追加！！！！！！！ 6/17

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": sorted(ALLOWED_ORIGINS),
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": False,
        }
    },
)


def _parse_positive_integer(value, fallback=1):
    matched = re.match(r"^\s*(-?\d+)", str(value or ""))
    parsed = int(matched.group(1)) if matched else fallback
    if parsed < 1:
        return fallback
    return parsed


def _get_current_user_id():
    auth_header = request.headers.get("Authorization", "")

    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        try:
            user = get_current_user_from_token(token)
            return int(user["id"])
        except Exception:
            pass

    matched = re.match(r"^\s*(-?\d+)", str(os.getenv("DEMO_USER_ID") or ""))
    user_id = int(matched.group(1)) if matched else 1
    return user_id if user_id > 0 else 1


def _validate_saved_recipe_user(user_id):
    try:
        if user_exists(user_id):
            return None

        return 404, {
            "ok": False,
            "message": "ユーザーが見つかりません。",
            "userId": user_id,
        }
    except Exception:
        return 500, {
            "ok": False,
            "message": "ユーザー確認に失敗しました。",
        }


@app.get("/")
def serve_index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.get("/api/health")
def health():
    db_configured = bool(
        (os.getenv("DB_HOST") or os.getenv("MYSQL_HOST") or os.getenv("MYSQLHOST"))
        and (os.getenv("DB_USER") or os.getenv("MYSQL_USER") or os.getenv("MYSQLUSER"))
        and (os.getenv("DB_NAME") or os.getenv("MYSQL_DATABASE") or os.getenv("MYSQLDATABASE"))
    )

    return jsonify(
        {
            "ok": True,
            "service": "mirunavi-backend",
            "database": {"configured": db_configured},
        }
    ), 200


@app.post("/api/auth/register")
def auth_register():
    payload = request.get_json(silent=True) or {}
    try:
        result = register_user(payload)
        return jsonify({"ok": True, "accessToken": result["accessToken"], "email": result["email"]}), 200
    except Exception as error:
        return jsonify({"ok": False, "message": getattr(error, "message", "ユーザー登録に失敗しました")}), getattr(error, "status", 400)


@app.post("/api/auth/login")
def auth_login():
    payload = request.get_json(silent=True) or {}
    try:
        result = login_user(payload)
        return jsonify({"ok": True, "accessToken": result["accessToken"], "email": result["email"]}), 200
    except Exception as error:
        return jsonify({"ok": False, "message": getattr(error, "message", "ログインに失敗しました")}), getattr(error, "status", 400)


@app.get("/api/auth/me")
def auth_me():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"ok": False, "message": "Authorization ヘッダーが必要です"}), 401

    token = auth_header[7:]
    try:
        user = get_current_user_from_token(token)
        return jsonify({"ok": True, "user": user}), 200
    except Exception as error:
        return jsonify({"ok": False, "message": getattr(error, "message", "認証に失敗しました")}), getattr(error, "status", 401)


@app.post("/api/auth/password-reset/request")
def auth_password_reset_request():
    payload = request.get_json(silent=True) or {}
    try:
        result = request_password_reset(
            payload,
            request_ip=request.remote_addr or "",
            user_agent=request.headers.get("User-Agent", ""),
        )
        return jsonify(result), 200
    except Exception as error:
        return jsonify({"ok": False, "message": getattr(error, "message", "パスワード再設定の受付に失敗しました")}), getattr(error, "status", 400)


@app.post("/api/auth/password-reset/confirm")
def auth_password_reset_confirm():
    payload = request.get_json(silent=True) or {}
    try:
        result = confirm_password_reset(payload)
        return jsonify(result), 200
    except Exception as error:
        return jsonify({"ok": False, "message": getattr(error, "message", "パスワード再設定に失敗しました")}), getattr(error, "status", 400)


@app.get("/api/users/me/profile")
def get_my_profile():
    user_id = _get_current_user_id()
    status, body = get_user_profile_for_user(user_id)
    return jsonify(body), status


@app.put("/api/users/me/profile")
def put_my_profile():
    user_id = _get_current_user_id()
    payload = request.get_json(silent=True) or {}
    status, body = update_user_profile_for_user(user_id, payload)
    return jsonify(body), status

#コミュニティ機能 いいね機能
@app.post("/api/posts/<int:post_id>/likes")
def add_post_like(post_id):
    user_id = _get_current_user_id()
    return good_add(post_id, user_id)


@app.delete("/api/posts/<int:post_id>/likes")
def remove_post_like(post_id):
    user_id = _get_current_user_id()
    return good_rem(post_id, user_id)


@app.get("/api/users/me/owned-items")
def get_my_owned_items():
    user_id = _get_current_user_id()
    status, body = list_user_owned_items_for_user(user_id)
    return jsonify(body), status


@app.post("/api/users/me/owned-items")
def post_my_owned_item():
    user_id = _get_current_user_id()
    payload = request.get_json(silent=True) or {}
    status, body = add_user_owned_item_for_user(user_id, payload)
    return jsonify(body), status


@app.delete("/api/users/me/owned-items/<item_id>")
def delete_my_owned_item(item_id):
    user_id = _get_current_user_id()
    status, body = delete_user_owned_item_for_user(user_id, item_id)
    return jsonify(body), status


@app.get("/api/recipes/search")
def search_recipes():
    keyword = request.args.get("keyword", "").strip()
    result = search_recipes_from_db(
        keyword=keyword,
        limit=request.args.get("limit"),
        offset=request.args.get("offset"),
    )
    return jsonify(result), 200 if result.get("ok") else 503


@app.get("/api/users/me/saved-recipes")
def list_my_saved_recipes():
    user_id = _get_current_user_id()
    user_error = _validate_saved_recipe_user(user_id)
    if user_error:
        status, body = user_error
        return jsonify(body), status

    status, body = list_saved_recipes_for_user(
        user_id=user_id,
        keyword=request.args.get("keyword"),
        page_input=request.args.get("page"),
        limit_input=request.args.get("limit"),
        images_only_input=request.args.get("imagesOnly"),
    )
    return jsonify(body), status


@app.post("/api/users/me/saved-recipes")
def save_my_recipe():
    user_id = _get_current_user_id()
    user_error = _validate_saved_recipe_user(user_id)
    if user_error:
        status, body = user_error
        return jsonify(body), status

    payload = request.get_json(silent=True) or {}
    keyword = str(payload.get("keyword") or "").strip()
    source_api = str(payload.get("sourceApi") or "database").strip()

    recipes = payload.get("recipes")
    if not isinstance(recipes, list):
        recipe = payload.get("recipe")
        if isinstance(recipe, dict):
            recipes = [recipe]
        else:
            recipes = [payload] if isinstance(payload, dict) else []

    if not recipes:
        return jsonify({"ok": False, "message": "保存するレシピ情報がありません。"}), 400

    try:
        result = save_recipes_for_user(
            user_id=user_id,
            keyword=keyword,
            recipes=recipes,
            source_api=source_api,
        )
        status = 201 if int(result.get("savedCount") or 0) > 0 else 200
        return jsonify(result), status
    except Exception:
        return jsonify({"ok": False, "message": "保存済みレシピの保存に失敗しました。"}), 500


@app.delete("/api/users/me/saved-recipes/<saved_recipe_id>")
def delete_my_saved_recipe(saved_recipe_id):
    user_id = _get_current_user_id()
    user_error = _validate_saved_recipe_user(user_id)
    if user_error:
        status, body = user_error
        return jsonify(body), status

    result = delete_saved_recipe_for_user(user_id, saved_recipe_id)
    status = int(result.get("status") or 200)
    body = dict(result)
    body.pop("status", None)
    return jsonify(body), status


@app.get("/api/users/me/saved-recipes/count")
def count_my_saved_recipes():
    user_id = _get_current_user_id()
    user_error = _validate_saved_recipe_user(user_id)
    if user_error:
        status, body = user_error
        return jsonify(body), status

    try:
        count = count_saved_recipes_for_user(
            user_id,
            keyword=request.args.get("keyword"),
            images_only=str(request.args.get("imagesOnly") or "").lower() in ("true", "1", "yes", "on"),
        )
        return jsonify({"ok": True, "userId": user_id, "count": count}), 200
    except Exception:
        return jsonify({"ok": False, "message": "保存済みレシピ件数の取得に失敗しました。"}), 500


@app.get("/<path:filename>")
def serve_frontend_file(filename):
    if filename.startswith("api/"):
        return jsonify({"ok": False, "error": "API endpoint not found"}), 404

    target_path = FRONTEND_DIR / filename
    if target_path.exists() and target_path.is_file():
        return send_from_directory(FRONTEND_DIR, filename)

    return send_from_directory(FRONTEND_DIR, "index.html")

##ここから追加 6/30 キーワード検索でレシピを取得するAPIエンドポイントに変更
@app.route("/api/getRecipe")
def getRecipe():
    keyword = request.args.get("keyword", "").strip()

    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        if keyword:
            like_keyword = f"%{keyword}%"
            sql = """
                SELECT recipe_id, name, main, time, diff, description, ingredients, steps, category
                FROM recipe
                WHERE name LIKE %s
                   OR main LIKE %s
                   OR description LIKE %s
                   OR ingredients LIKE %s
                LIMIT 50;
            """
            cursor.execute(sql, (like_keyword, like_keyword, like_keyword, like_keyword))
        else:
            sql = """
                SELECT recipe_id, name, main, time, diff, description, ingredients, steps, category
                FROM recipe
                LIMIT 30;
            """
            cursor.execute(sql)

        data = cursor.fetchall()
        return jsonify(data)

    except Error as e:
        print("DBエラー", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

##----ここまで追加

#ここからAIカメラ判定機能 6/20
#----ここからapi呼び出し部分、services/foodenvaluation_serviceの関数・OLLAMA環境変数読み込み 
#----servicesフォルダに関連ファイルあり


@app.route("/api/food-evaluation", methods=["POST"])
def food_evaluation():
    started_at = time.perf_counter()
    data = request.get_json(silent=True) or {}
    recipe_name = str(data.get("recipe_name") or "").strip()

    try:
        image_base64 = strip_data_url(data.get("image_base64"))
    except ValueError as exc:
        result = default_evaluation(recipe_name, str(exc))
        return jsonify({**result, "error": True, "error_code": "INVALID_IMAGE", "message": str(exc)}), 400

    try:
        ollama_started_at = time.perf_counter()
        ai_text = call_ollama(recipe_name, image_base64)
        ollama_ms = round((time.perf_counter() - ollama_started_at) * 1000)
    except requests.exceptions.ConnectionError:
        message = "Ollamaに接続できません。Ollamaが起動しているか確認してください。"
        result = default_evaluation(recipe_name, message)
        return jsonify({**result, "error": True, "error_code": "OLLAMA_UNAVAILABLE", "message": message}), 503
    except requests.exceptions.Timeout:
        message = "Ollamaの応答がタイムアウトしました。モデルの起動状態を確認してください。"
        result = default_evaluation(recipe_name, message)
        return jsonify({**result, "error": True, "error_code": "OLLAMA_TIMEOUT", "message": message}), 504
    except RuntimeError as exc:
        message = str(exc)
        code = "OLLAMA_MODEL_NOT_FOUND" if "モデルが見つかりません" in message else "OLLAMA_ERROR"
        result = default_evaluation(recipe_name, message)
        return jsonify({**result, "error": True, "error_code": code, "message": message}), 502

    try:
        raw = extract_json_text(ai_text)
    except Exception:
        message = "AI応答をJSONとして解析できませんでした。モデルの応答形式を確認してください。"
        result = default_evaluation(recipe_name, message)
        return jsonify({**result, "error": True, "error_code": "INVALID_AI_JSON", "message": message}), 502

    result = normalize_evaluation(raw, recipe_name)
    result["debug_timing_ms"] = {
        "ollama": ollama_ms,
        "total": round((time.perf_counter() - started_at) * 1000),
    }
    app.logger.info(
        "food_evaluation recipe=%s model=%s image_chars=%s ollama_ms=%s total_ms=%s",
        recipe_name,
        OLLAMA_VISION_MODEL,  # ← service側の定数を参照したい場合は下記注意点を読んでね
        len(image_base64),
        result["debug_timing_ms"]["ollama"],
        result["debug_timing_ms"]["total"],
    )
    return jsonify(result)

##----ここまで追加


# 08/27 追加 献立提案機能

@app.post("/api/menu-proposal")
def menu_proposal():
    try:
        result = generate_menu_proposal(request.get_json(silent=True) or {})
        return jsonify(result), 200
    except MenuProposalError as error:
        return jsonify({
            "ok": False,
            "errorCode": error.error_code,
            "message": error.message,
        }), error.status
# ここまで


# python app.py で直接起動された場合だけ、Flaskサーバーを起動する
if __name__ == "__main__":
    app.run(host="0.0.0.0",port=5000,debug=True)

