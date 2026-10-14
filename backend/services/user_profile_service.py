import re

from db import close_db_resource_safely, get_connection, query


# アカウント基本情報APIで使うDB処理をまとめたファイルです。
# app.py にSQLを直接たくさん書くと読みにくくなるため、
# ユーザー情報の取得・保存処理をここへ分けています。

# users.name に保存するニックネームの最大文字数です。
MAX_NICKNAME_LENGTH = 100

# users.email に保存するメールアドレスの最大文字数です。
MAX_EMAIL_LENGTH = 255

# user_profiles.favorite_genres / disliked_ingredients に保存する最大文字数です。
MAX_PROFILE_TEXT_LENGTH = 500

# MySQLで「テーブルが存在しない」ときに返る代表的なエラー番号です。
# まだSQLファイルをAivenへ反映していない環境でもGETだけは安全に返すために使います。
MYSQL_TABLE_NOT_FOUND_ERROR = 1146

# MySQLでUNIQUE制約に違反したときの代表的なエラー番号です。
# users.email はUNIQUEなので、同じメールアドレスがある場合に使います。
MYSQL_DUPLICATE_ENTRY_ERROR = 1062


# DBに保存する文字列を安全な形にそろえる関数
def normalize_text(value, max_length):
    # None が来ても空文字として扱い、前後の空白を削ります。
    text = str(value or "").strip()

    # 改行やタブが混ざっていても、画面で扱いやすいよう1つの空白にそろえます。
    text = re.sub(r"\s+", " ", text)

    # DBのVARCHAR長を超えないように、必要な文字数で切ります。
    return text[:max_length]


# frontendへ返すプロフィールJSONを作る関数
def build_profile_response(user_id, user_row, profile_row=None):
    # profile_row が無い場合でも、画面側が空文字として表示できるようにします。
    safe_profile_row = profile_row if isinstance(profile_row, dict) else {}

    return {
        "ok": True,
        "userId": user_id,
        # users.name を画面側では nickname として扱います。
        "nickname": user_row.get("name") or "",
        # users.email をそのまま email として返します。
        "email": user_row.get("email") or "",
        # 詳細プロフィールがまだ無い場合は空文字で返します。
        "favoriteGenres": safe_profile_row.get("favorite_genres") or "",
        "dislikedIngredients": safe_profile_row.get("disliked_ingredients") or "",
    }


# PUTのレスポンスで使う profile オブジェクトを作る関数
def build_saved_profile_object(nickname, email, favorite_genres, disliked_ingredients):
    return {
        "nickname": nickname,
        "email": email,
        "favoriteGenres": favorite_genres,
        "dislikedIngredients": disliked_ingredients,
    }


# メールアドレスを簡単にチェックする関数
def is_valid_email(email):
    # 今回は本格ログインではないため、最低限「@」とドメインらしい形だけ確認します。
    # 空文字や空白入りの値は保存できない入力として扱います。
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))


# MySQL例外が「user_profiles テーブル未作成」かどうかを判定する関数
def is_table_not_found_error(error):
    return getattr(error, "errno", None) == MYSQL_TABLE_NOT_FOUND_ERROR


# MySQL例外が「メールアドレス重複」かどうかを判定する関数
def is_duplicate_entry_error(error):
    return getattr(error, "errno", None) == MYSQL_DUPLICATE_ENTRY_ERROR


# users テーブルから、画面に返してよい基本情報だけを取得する関数
def fetch_user_basic_info(user_id):
    rows = query(
        """
        SELECT
          user_id,
          name,
          email
        FROM users
        WHERE user_id = %s
        LIMIT 1
        """,
        [user_id],
    )

    return rows[0] if rows else None


# user_profiles テーブルから、プロフィール詳細だけを取得する関数
def fetch_user_profile_details(user_id):
    rows = query(
        """
        SELECT
          favorite_genres,
          disliked_ingredients
        FROM user_profiles
        WHERE user_id = %s
        LIMIT 1
        """,
        [user_id],
    )

    return rows[0] if rows else None


# GET /api/users/demo/profile 用のレスポンスを作る関数
def get_user_profile_for_user(user_id):
    try:
        # users から、ニックネームとメールアドレスだけを取得します。
        # password_hash と delicious_points は取得しません。
        user_row = fetch_user_basic_info(user_id)

        if not user_row:
            return 404, {
                "ok": False,
                "message": "DEMO_USER_ID に対応するユーザーが見つかりません",
                "userId": user_id,
            }

        try:
            # user_profiles から、好きな料理ジャンルと苦手な食材を取得します。
            # まだ行が無い場合は None になり、空文字で返します。
            profile_row = fetch_user_profile_details(user_id)
        except Exception as error:
            # SQLファイルをまだAivenへ反映していない環境でも、GETだけは落とさず空の詳細で返します。
            # それ以外のDBエラーは外側のexceptで安全なエラーにします。
            if not is_table_not_found_error(error):
                raise
            profile_row = None

        return 200, build_profile_response(user_id, user_row, profile_row)
    except Exception:
        # DB接続先やパスワードなどが混ざる可能性があるため、例外詳細はレスポンスに出しません。
        return 500, {
            "ok": False,
            "message": "ユーザー情報の取得に失敗しました",
        }


# PUTで送られたJSONを、DB保存用の文字列へそろえる関数
def normalize_profile_payload(payload):
    # JSONがobjectではない場合は、空のobjectとして扱います。
    safe_payload = payload if isinstance(payload, dict) else {}

    nickname = normalize_text(safe_payload.get("nickname"), MAX_NICKNAME_LENGTH)
    email = normalize_text(safe_payload.get("email"), MAX_EMAIL_LENGTH)
    favorite_genres = normalize_text(
        safe_payload.get("favoriteGenres"),
        MAX_PROFILE_TEXT_LENGTH,
    )
    disliked_ingredients = normalize_text(
        safe_payload.get("dislikedIngredients"),
        MAX_PROFILE_TEXT_LENGTH,
    )

    return {
        "nickname": nickname,
        "email": email,
        "favoriteGenres": favorite_genres,
        "dislikedIngredients": disliked_ingredients,
    }


# PUT /api/users/demo/profile 用の保存処理を行う関数
def update_user_profile_for_user(user_id, payload):
    profile = normalize_profile_payload(payload)

    # email は users.email が NOT NULL / UNIQUE なので、空文字や明らかな形式不正は400にします。
    if not is_valid_email(profile["email"]):
        return 400, {
            "ok": False,
            "message": "メールアドレスの形式を確認してください",
        }

    connection = None
    cursor = None

    try:
        # users と user_profiles をまとめて保存するため、1つのDB接続で処理します。
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        # 対象ユーザーが存在するか確認します。
        # ここでも password_hash と delicious_points は取得しません。
        cursor.execute(
            """
            SELECT user_id
            FROM users
            WHERE user_id = %s
            LIMIT 1
            """,
            [user_id],
        )
        user_row = cursor.fetchone()

        if not user_row:
            connection.rollback()
            return 404, {
                "ok": False,
                "message": "DEMO_USER_ID に対応するユーザーが見つかりません",
                "userId": user_id,
            }

        # users.name と users.email だけを更新します。
        # password_hash と delicious_points はUPDATEに含めません。
        cursor.execute(
            """
            UPDATE users
            SET
              name = %s,
              email = %s
            WHERE user_id = %s
            """,
            [
                profile["nickname"],
                profile["email"],
                user_id,
            ],
        )

        # user_profiles は1ユーザー1行なので、存在しなければINSERT、存在すればUPDATEします。
        # ON DUPLICATE KEY UPDATE は PRIMARY KEY(user_id) の重複時に既存行を更新します。
        cursor.execute(
            """
            INSERT INTO user_profiles (
              user_id,
              favorite_genres,
              disliked_ingredients
            ) VALUES (
              %s,
              %s,
              %s
            )
            ON DUPLICATE KEY UPDATE
              favorite_genres = VALUES(favorite_genres),
              disliked_ingredients = VALUES(disliked_ingredients)
            """,
            [
                user_id,
                profile["favoriteGenres"],
                profile["dislikedIngredients"],
            ],
        )

        # users と user_profiles の両方が成功した場合だけ確定します。
        connection.commit()

        return 200, {
            "ok": True,
            "message": "ユーザー情報を保存しました",
            "userId": user_id,
            "profile": build_saved_profile_object(
                profile["nickname"],
                profile["email"],
                profile["favoriteGenres"],
                profile["dislikedIngredients"],
            ),
        }
    except Exception as error:
        # 途中で失敗した場合は、users だけ更新されることを防ぐためロールバックします。
        try:
            if connection is not None:
                connection.rollback()
        except Exception:
            # rollback失敗の詳細にもDB情報が混ざる可能性があるため、レスポンスに出しません。
            pass

        if is_duplicate_entry_error(error):
            return 409, {
                "ok": False,
                "message": "このメールアドレスはすでに使われています",
            }

        return 500, {
            "ok": False,
            "message": "ユーザー情報の保存に失敗しました",
        }
    finally:
        close_db_resource_safely(cursor)
        close_db_resource_safely(connection)
