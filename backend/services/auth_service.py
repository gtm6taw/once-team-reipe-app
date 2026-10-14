import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urljoin

import bcrypt
import jwt

from db import (
    close_db_resource_safely,
    execute,
    get_connection,
    query,
    rollback_db_connection_safely,
)


JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY") or os.urandom(32).hex()
JWT_EXPIRATION_HOURS = 24
PASSWORD_RESET_DEFAULT_MINUTES = 60
PASSWORD_RESET_REQUEST_MESSAGE = (
    "メールアドレスを確認しました。パスワード再設定の案内を送信しました。"
)
MYSQL_TABLE_NOT_FOUND_ERROR = 1146


class AuthError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status


def _is_enabled(value):
    return str(value or "").strip().lower() in ("1", "true", "yes", "on")


def _get_password_reset_token_minutes():
    try:
        minutes = int(str(os.environ.get("PASSWORD_RESET_TOKEN_MINUTES") or "").strip())
    except ValueError:
        minutes = PASSWORD_RESET_DEFAULT_MINUTES

    return max(1, min(minutes, 1440))


def _hash_password_reset_token(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _build_dev_reset_url(token):
    frontend_base_url = (os.environ.get("FRONTEND_BASE_URL") or "").strip()
    if not frontend_base_url:
        frontend_base_url = "http://localhost:3000/"

    reset_page_url = urljoin(frontend_base_url.rstrip("/") + "/", "reset-password.html")
    return f"{reset_page_url}?token={token}"


def _generate_access_token(user_id, email, nickname):
    payload = {
        "user_id": user_id,
        "email": email,
        "nickname": nickname,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")


def _is_table_not_found_error(error):
    return getattr(error, "errno", None) == MYSQL_TABLE_NOT_FOUND_ERROR


def register_user(payload):
    if not isinstance(payload, dict):
        raise AuthError("リクエスト形式が正しくありません。", 400)

    email = str(payload.get("email") or "").strip()
    password = str(payload.get("password") or "")
    nickname = str(payload.get("nickname") or "").strip()

    if not email:
        raise AuthError("メールアドレスを入力してください。", 400)
    if not password:
        raise AuthError("パスワードを入力してください。", 400)
    if not nickname:
        raise AuthError("ニックネームを入力してください。", 400)

    existing = query("SELECT user_id FROM users WHERE email = %s", [email])
    if existing:
        raise AuthError("そのメールアドレスは既に登録されています。", 409)

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    result = execute(
        "INSERT INTO users (email, password_hash, name) VALUES (%s, %s, %s)",
        [email, password_hash, nickname],
    )
    user_id = result.get("insert_id")
    if not user_id:
        raise AuthError("ユーザー登録に失敗しました。", 500)

    token = _generate_access_token(user_id, email, nickname)
    return {"userId": user_id, "accessToken": token, "email": email}


def login_user(payload):
    if not isinstance(payload, dict):
        raise AuthError("リクエスト形式が正しくありません。", 400)

    email = str(payload.get("email") or "").strip()
    password = str(payload.get("password") or "")

    if not email:
        raise AuthError("メールアドレスを入力してください。", 400)
    if not password:
        raise AuthError("パスワードを入力してください。", 400)

    rows = query(
        "SELECT user_id, email, password_hash, name FROM users WHERE email = %s",
        [email],
    )
    if not rows:
        raise AuthError("メールアドレスまたはパスワードが正しくありません。", 401)

    user = rows[0]
    stored_hash = user.get("password_hash") or ""
    if not bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8")):
        raise AuthError("メールアドレスまたはパスワードが正しくありません。", 401)

    token = _generate_access_token(user["user_id"], user["email"], user.get("name") or "")
    return {
        "userId": user["user_id"],
        "accessToken": token,
        "email": user["email"],
    }


def request_password_reset(payload, request_ip="", user_agent=""):
    if not isinstance(payload, dict):
        raise AuthError("リクエスト形式が正しくありません。", 400)

    email = str(payload.get("email") or "").strip()
    if not email:
        raise AuthError("メールアドレスを入力してください。", 400)

    rows = query("SELECT user_id, email FROM users WHERE email = %s", [email])
    if not rows:
        return {"ok": True, "message": PASSWORD_RESET_REQUEST_MESSAGE}

    token = secrets.token_urlsafe(32)
    token_hash = _hash_password_reset_token(token)
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=_get_password_reset_token_minutes()
    )

    try:
        execute(
            """
            INSERT INTO password_reset_tokens
                (user_id, token_hash, expires_at, request_ip, user_agent)
            VALUES
                (%s, %s, %s, %s, %s)
            """,
            [
                rows[0]["user_id"],
                token_hash,
                expires_at.replace(tzinfo=None),
                str(request_ip or "")[:45] or None,
                str(user_agent or "")[:255] or None,
            ],
        )
    except Exception as error:
        if _is_table_not_found_error(error):
            raise AuthError("パスワード再設定テーブルが未作成です。", 503)
        raise

    response = {"ok": True, "message": PASSWORD_RESET_REQUEST_MESSAGE}
    if _is_enabled(os.environ.get("PASSWORD_RESET_DEV_LINK_ENABLED")):
        response["devResetUrl"] = _build_dev_reset_url(token)

    return response


def confirm_password_reset(payload):
    if not isinstance(payload, dict):
        raise AuthError("リクエスト形式が正しくありません。", 400)

    token = str(payload.get("token") or "").strip()
    new_password = str(payload.get("newPassword") or "")

    if not token:
        raise AuthError("トークンがありません。", 400)
    if not new_password:
        raise AuthError("新しいパスワードを入力してください。", 400)

    token_hash = _hash_password_reset_token(token)

    try:
        rows = query(
            """
            SELECT id, user_id, expires_at, used_at
            FROM password_reset_tokens
            WHERE token_hash = %s
            LIMIT 1
            """,
            [token_hash],
        )
    except Exception as error:
        if _is_table_not_found_error(error):
            raise AuthError("パスワード再設定テーブルが未作成です。", 503)
        raise

    if not rows:
        raise AuthError("再設定URLが正しくないか、有効期限切れです。", 400)

    reset_token = rows[0]
    if reset_token.get("used_at") is not None:
        raise AuthError("この再設定URLはすでに使われています。", 400)

    expires_at = reset_token.get("expires_at")
    if expires_at is None:
        raise AuthError("再設定URLが正しくないか、有効期限切れです。", 400)

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at <= datetime.now(timezone.utc):
        raise AuthError("再設定URLの有効期限が切れています。", 400)

    new_password_hash = bcrypt.hashpw(
        new_password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute(
            "UPDATE users SET password_hash = %s WHERE user_id = %s",
            [new_password_hash, reset_token["user_id"]],
        )
        cursor.execute(
            """
            UPDATE password_reset_tokens
            SET used_at = UTC_TIMESTAMP()
            WHERE id = %s AND used_at IS NULL
            """,
            [reset_token["id"]],
        )

        if cursor.rowcount != 1:
            raise AuthError("この再設定URLはすでに使われています。", 400)

        connection.commit()
    except AuthError:
        rollback_db_connection_safely(connection)
        raise
    except Exception as error:
        rollback_db_connection_safely(connection)
        if _is_table_not_found_error(error):
            raise AuthError("パスワード再設定テーブルが未作成です。", 503)
        raise
    finally:
        close_db_resource_safely(cursor)
        close_db_resource_safely(connection)

    return {
        "ok": True,
        "message": "パスワードを再設定しました。ログインしてください。",
    }


def get_current_user_from_token(token):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise AuthError("トークンの有効期限が切れています。", 401)
    except jwt.InvalidTokenError:
        raise AuthError("無効なトークンです。", 401)

    user_id = payload.get("user_id")
    if not user_id:
        raise AuthError("トークンにユーザー情報がありません。", 401)

    rows = query(
        "SELECT user_id, email, name FROM users WHERE user_id = %s",
        [user_id],
    )
    if not rows:
        raise AuthError("ユーザーが見つかりません。", 404)

    user = rows[0]
    return {
        "id": user["user_id"],
        "email": user["email"],
        "nickname": user.get("name") or "",
    }
