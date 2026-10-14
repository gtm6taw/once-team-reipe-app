import re

from db import execute, query


# アカウント画面の「持っている食材・調味料」APIで使うDB処理をまとめたファイルです。
# app.py にSQLを直接たくさん書くと読みにくくなるため、
# 一覧取得・追加・削除の処理をここへ分けています。

# user_owned_items.item_name に保存する最大文字数です。
MAX_ITEM_NAME_LENGTH = 100

# user_owned_items.category に保存できる値です。
# 画面上の「食材」「調味料」は、DBでは英語の固定値で保存します。
ALLOWED_CATEGORIES = {"ingredient", "seasoning"}

# user_owned_items.amount_note に保存する最大文字数です。
MAX_AMOUNT_NOTE_LENGTH = 255


# 文字列をDB保存しやすい形にそろえる関数
def normalize_text(value, max_length):
    # None が来ても空文字として扱い、前後の空白を削ります。
    text = str(value or "").strip()

    # 改行やタブが混ざっていても、画面で扱いやすいよう1つの空白にそろえます。
    text = re.sub(r"\s+", " ", text)

    # DBのVARCHAR長を超えないように、必要な文字数で切ります。
    return text[:max_length]


# category をDB保存用の値へそろえる関数
def normalize_category(value):
    # category はAPI用の固定値なので、小文字にそろえて判定しやすくします。
    return str(value or "").strip().lower()


# URLの <id> のような値を安全な正の整数へ変換する関数
def parse_positive_integer(value, fallback_value=0):
    # 先頭にある整数だけを読み取り、数字でなければ fallback_value を使います。
    matched = re.match(r"^\s*(-?\d+)", str(value or ""))
    parsed = int(matched.group(1)) if matched else fallback_value

    # 1未満のIDはDBの主キーとして使わないため、fallback_value に戻します。
    if parsed < 1:
        return fallback_value

    return parsed


# users テーブルに対象ユーザーが存在するか確認する関数
def user_exists_for_owned_items(user_id):
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


# DBから取得した1行を、frontendが使いやすいJSONへ変換する関数
def format_owned_item(row):
    return {
        "id": row.get("id"),
        "itemName": row.get("item_name") or "",
        "category": row.get("category") or "",
        "amountNote": row.get("amount_note") or "",
    }


# ingredients / seasonings の配列に入れる短いJSONを作る関数
def format_owned_item_group_entry(item):
    return {
        "id": item.get("id"),
        "itemName": item.get("itemName") or "",
        "amountNote": item.get("amountNote") or "",
    }


# GET /api/users/demo/owned-items 用のレスポンスを作る関数
def build_owned_items_response(user_id, rows):
    # DBの列名を、frontendで使いやすい camelCase の名前へ変換します。
    items = [format_owned_item(row) for row in rows]

    # category が ingredient のものだけを、食材一覧として分けます。
    ingredients = [
        format_owned_item_group_entry(item)
        for item in items
        if item.get("category") == "ingredient"
    ]

    # category が seasoning のものだけを、調味料一覧として分けます。
    seasonings = [
        format_owned_item_group_entry(item)
        for item in items
        if item.get("category") == "seasoning"
    ]

    return {
        "ok": True,
        "userId": user_id,
        "items": items,
        "ingredients": ingredients,
        "seasonings": seasonings,
    }


# Gemini料理提案APIで使う、食材名・調味料名だけの一覧を作る関数
def build_owned_item_names_response(user_id, owned_items_body):
    # GET一覧APIのレスポンスを再利用し、Geminiへ渡す名前だけを取り出します。
    # id や amountNote は料理提案の材料名としては不要なので、ここでは返しません。
    ingredients = [
        normalize_text(item.get("itemName"), MAX_ITEM_NAME_LENGTH)
        for item in owned_items_body.get("ingredients", [])
        if isinstance(item, dict)
    ]

    # 調味料は料理提案の参考情報としてGeminiへ渡します。
    seasonings = [
        normalize_text(item.get("itemName"), MAX_ITEM_NAME_LENGTH)
        for item in owned_items_body.get("seasonings", [])
        if isinstance(item, dict)
    ]

    return {
        "ok": True,
        "userId": user_id,
        "ingredients": [item_name for item_name in ingredients if item_name],
        "seasonings": [item_name for item_name in seasonings if item_name],
    }


# Gemini料理提案API用に、DB保存済みの食材名・調味料名だけを取得する関数
def list_user_owned_item_names_for_gemini(user_id):
    # 既存の一覧取得処理を通すことで、user_id条件や安全なDBエラー処理を同じにします。
    status, body = list_user_owned_items_for_user(user_id)

    # ユーザー不在やDBエラーの場合は、既存APIと同じ安全なメッセージを返します。
    if status != 200 or not body.get("ok"):
        return status, body

    # Geminiへ渡すため、itemNameだけの短い配列に変換します。
    return 200, build_owned_item_names_response(user_id, body)


# POSTで送られたJSONを、DB保存用の値へそろえる関数
def normalize_owned_item_payload(payload):
    # JSONがobjectではない場合は、空のobjectとして扱います。
    safe_payload = payload if isinstance(payload, dict) else {}

    return {
        "itemName": normalize_text(
            safe_payload.get("itemName"),
            MAX_ITEM_NAME_LENGTH,
        ),
        "category": normalize_category(safe_payload.get("category")),
        "amountNote": normalize_text(
            safe_payload.get("amountNote"),
            MAX_AMOUNT_NOTE_LENGTH,
        ),
    }


# GET /api/users/demo/owned-items 用の一覧取得処理を行う関数
def list_user_owned_items_for_user(user_id):
    try:
        # users テーブルに仮ユーザーIDがある場合だけ、一覧取得を続けます。
        if not user_exists_for_owned_items(user_id):
            return 404, {
                "ok": False,
                "message": "DEMO_USER_ID に対応するユーザーが見つかりません",
                "userId": user_id,
            }

        # user_owned_items から、対象ユーザーの食材・調味料だけを取得します。
        # パスワードやDB接続情報は、このSQLでは取得しません。
        rows = query(
            """
            SELECT
              id,
              item_name,
              category,
              amount_note
            FROM user_owned_items
            WHERE user_id = %s
            ORDER BY created_at DESC, id DESC
            """,
            [user_id],
        )

        # frontend が扱いやすいように、全体一覧と分類別一覧をまとめて返します。
        return 200, build_owned_items_response(user_id, rows)
    except Exception:
        # DB接続先やSQL例外の詳細には秘密情報が混ざる可能性があるため、固定文だけ返します。
        return 500, {
            "ok": False,
            "message": "持っている食材・調味料の取得に失敗しました",
        }


# POST /api/users/demo/owned-items 用の追加処理を行う関数
def add_user_owned_item_for_user(user_id, payload):
    # frontend から送られてきた値を、DB保存用の安全な文字列へそろえます。
    item = normalize_owned_item_payload(payload)

    # 食材名は必須なので、空文字ならDBへ保存せず400を返します。
    if not item["itemName"]:
        return 400, {
            "ok": False,
            "message": "食材・調味料名を入力してください",
        }

    # category は決められた2種類だけを許可します。
    if item["category"] not in ALLOWED_CATEGORIES:
        return 400, {
            "ok": False,
            "message": "分類は ingredient または seasoning を指定してください",
        }

    try:
        # users テーブルに仮ユーザーIDがある場合だけ、追加処理を続けます。
        if not user_exists_for_owned_items(user_id):
            return 404, {
                "ok": False,
                "message": "DEMO_USER_ID に対応するユーザーが見つかりません",
                "userId": user_id,
            }

        # user_owned_items に、食材・調味料を1件追加します。
        # user_id を必ず入れることで、仮ユーザー本人のデータとして保存します。
        result = execute(
            """
            INSERT INTO user_owned_items (
              user_id,
              item_name,
              category,
              amount_note
            ) VALUES (
              %s,
              %s,
              %s,
              %s
            )
            """,
            [
                user_id,
                item["itemName"],
                item["category"],
                item["amountNote"],
            ],
        )

        # 追加した行のIDを使って、frontendに返すitemを作ります。
        inserted_id = result.get("insert_id")
        saved_item = {
            "id": inserted_id,
            "itemName": item["itemName"],
            "category": item["category"],
            "amountNote": item["amountNote"],
        }

        return 201, {
            "ok": True,
            "message": "食材・調味料を追加しました",
            "item": saved_item,
        }
    except Exception:
        # DB接続情報やSQL例外の詳細は、レスポンスに出しません。
        return 500, {
            "ok": False,
            "message": "食材・調味料の追加に失敗しました",
        }


# DELETE /api/users/demo/owned-items/<id> 用の削除処理を行う関数
def delete_user_owned_item_for_user(user_id, item_id):
    # URLから受け取ったidを、DBで使える正の整数へ変換します。
    safe_item_id = parse_positive_integer(item_id, 0)

    # 不正なidの場合は、DBへDELETEを実行せず400を返します。
    if safe_item_id < 1:
        return 400, {
            "ok": False,
            "message": "削除する食材・調味料IDが正しくありません",
        }

    try:
        # users テーブルに仮ユーザーIDがある場合だけ、削除処理を続けます。
        if not user_exists_for_owned_items(user_id):
            return 404, {
                "ok": False,
                "message": "DEMO_USER_ID に対応するユーザーが見つかりません",
                "userId": user_id,
            }

        # 本人のデータだけを削除するため、id だけでなく user_id も必ず条件に入れます。
        result = execute(
            """
            DELETE FROM user_owned_items
            WHERE id = %s
              AND user_id = %s
            """,
            [safe_item_id, user_id],
        )

        # rowcount が0の場合は、対象idが無いか、別ユーザーのデータだったという意味です。
        if result.get("rowcount") == 0:
            return 404, {
                "ok": False,
                "message": "削除対象の食材・調味料が見つかりません",
            }

        return 200, {
            "ok": True,
            "message": "食材・調味料を削除しました",
        }
    except Exception:
        # DB接続情報やSQL例外の詳細は、レスポンスに出しません。
        return 500, {
            "ok": False,
            "message": "食材・調味料の削除に失敗しました",
        }
