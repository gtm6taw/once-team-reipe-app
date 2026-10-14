import os


# MySQL接続をまとめるファイル
# DBの接続情報は .env や Render の Environment Variables から読み込み、コードには直接書かない

mysql_connector = None
connection_pool = None


# 文字列を整数へ変換する関数
# DB_PORT のような環境変数は文字列で入るため、MySQLへ渡す前に数値へそろえる
def parse_integer(value, fallback_value):
    try:
        return int(str(value or "").strip())
    except ValueError:
        return fallback_value


# 環境変数の文字列を True / False に変換する関数
# DB_SSL_VERIFY_CERT のような設定は "true" や "false" の文字列で入るため、MySQLへ渡す前に真偽値へそろえる
def parse_boolean(value):
    text = str(value or "").strip().lower()

    # 未設定の場合は None にして、mysql-connector-python の初期値をそのまま使う
    if not text:
        return None

    # Render やローカル環境でよく使う書き方を True として扱う
    if text in ("1", "true", "yes", "on"):
        return True

    # false 指定もできるようにする
    if text in ("0", "false", "no", "off"):
        return False

    # 想定外の値は安全側で None にして、接続設定を壊さない
    return None


# mysql.connector を読み込む関数
# ライブラリが無い場合は、DB検索APIだけエラーにして既存APIは動かせるようにする
def get_mysql_connector():
    global mysql_connector

    # すでに読み込み済みなら、同じものを再利用する
    if mysql_connector:
        return mysql_connector

    try:
        # mysql.connector は Python からMySQLを使うためのライブラリ
        import mysql.connector
        from mysql.connector import pooling

        mysql_connector = {
            "connector": mysql.connector,
            "pooling": pooling,
        }
        return mysql_connector
    except ImportError:
        # ライブラリが無い場合は、呼び出し元で分かりやすいエラーにする
        return None


# MySQL接続設定を環境変数から作る関数
# 実際のパスワードや秘密情報は、ログにもレスポンスにも出さない
def get_db_config():
    return {
        # DBサーバーのホスト名
        "host": os.getenv("DB_HOST") or os.getenv("MYSQL_HOST") or os.getenv("MYSQLHOST") or "",
        # DBサーバーのポート番号
        "port": parse_integer(
            os.getenv("DB_PORT") or os.getenv("MYSQL_PORT") or os.getenv("MYSQLPORT"),
            3306,
        ),
        # DBへログインするユーザー名
        "user": os.getenv("DB_USER") or os.getenv("MYSQL_USER") or os.getenv("MYSQLUSER") or "",
        # DBへログインするパスワード
        # 値は絶対にログへ出さない
        "password": os.getenv("DB_PASSWORD")
        or os.getenv("MYSQL_PASSWORD")
        or os.getenv("MYSQLPASSWORD")
        or "",
        # 楽天レシピ保存用DB名
        "database": os.getenv("DB_NAME")
        or os.getenv("MYSQL_DATABASE")
        or os.getenv("MYSQLDATABASE")
        or "rakuten_recipes_db",
        # Aiven MySQLでCA証明書を使う場合のパス
        # 証明書の中身は環境変数やGitHubに書かず、ファイルパスだけを渡す
        "ssl_ca": os.getenv("DB_SSL_CA_PATH") or "",
        # SSL証明書の検証を明示したい場合だけ使う
        "ssl_verify_cert": parse_boolean(os.getenv("DB_SSL_VERIFY_CERT")),
    }


# DB接続に最低限必要な設定が入っているか確認する関数
def has_required_db_config(config):
    # host / user / database が無い場合、MySQLへ接続できない
    return bool(config.get("host") and config.get("user") and config.get("database"))


# MySQLの接続プールを取得する関数
# 接続プールを使うと、検索APIが呼ばれるたびに新規接続を作らずに済む
def get_pool():
    global connection_pool

    # すでに接続プールを作っている場合は、それを再利用する
    if connection_pool:
        return connection_pool

    mysql = get_mysql_connector()

    # ライブラリが無い場合は、分かりやすいエラーにする
    if not mysql:
        raise RuntimeError("mysql-connector-python がインストールされていません。")

    # 環境変数からDB接続設定を取得する
    config = get_db_config()

    # DB接続に必要な設定が無い場合は、秘密情報を出さずにエラーにする
    if not has_required_db_config(config):
        raise RuntimeError("DB接続設定が不足しています。")

    # MySQL接続プールへ渡す設定を作る
    pool_config = {
        "pool_name": "mirunavi_pool",
        "pool_size": 5,
        # Aiven MySQLで pooled connection を返す時に reset_session が走ると、
        # 環境によって SET @@session.sql_mode 付近で失敗することがあるため無効化する
        "pool_reset_session": False,
        "host": config["host"],
        "port": config["port"],
        "user": config["user"],
        "password": config["password"],
        "database": config["database"],
        "charset": "utf8mb4",
    }

    # DB_SSL_CA_PATH がある場合だけ、Aiven MySQLなどのSSL接続用CAパスを追加する
    if config.get("ssl_ca"):
        pool_config["ssl_ca"] = config["ssl_ca"]

    # DB_SSL_VERIFY_CERT が true / false で指定されている場合だけ、証明書検証設定を追加する
    if config.get("ssl_verify_cert") is not None:
        pool_config["ssl_verify_cert"] = config["ssl_verify_cert"]

    # MySQL接続プールを作る
    connection_pool = mysql["pooling"].MySQLConnectionPool(
        **pool_config
    )

    return connection_pool


# MySQL接続プールから接続を1つ取り出す関数
# 複数SQLをまとめて実行するサービスでは、この関数で1つの接続を使い回す
def get_connection():
    return get_pool().get_connection()


# cursor や connection を安全に閉じる関数
# close中の例外で、成功済みのAPIレスポンスがHTML 500に変わらないようにする
def close_db_resource_safely(resource):
    if resource is None:
        return

    try:
        resource.close()
    except BaseException:
        # close時のreset_session失敗などはレスポンス本文へ出さない
        # DBパスワードや接続先が混ざる可能性があるため、例外内容もログへ出さない
        return


# DB接続に残っている未完了の処理を安全に取り消す関数
# SELECTだけでもMySQL側では読み取り用トランザクションが残ることがあるため、
# 接続プールへ戻す前に rollback して、次のリクエストへ古い読み取り状態を持ち越さないようにする
def rollback_db_connection_safely(connection):
    if connection is None:
        return

    try:
        connection.rollback()
    except BaseException:
        # rollback中の例外にはDB接続先などが含まれる可能性があるため、内容は表示しない
        return


# SELECTなど、結果を取得するSQLを実行する関数
def query(sql, params=None):
    if params is None:
        params = []

    # プレースホルダ付きSQLを使うことで、SQLインジェクションを避ける
    connection = get_connection()
    cursor = None

    try:
        # dictionary=True にすると、row["recipe_title"] のように列名で値を読める
        cursor = connection.cursor(dictionary=True)
        cursor.execute(sql, params)
        return cursor.fetchall()
    finally:
        # pool_reset_session=False のため、SELECT後の読み取り状態を明示的に終わらせる
        # これにより、接続プール内の別接続だけ古い一覧を読む問題を防ぐ
        rollback_db_connection_safely(connection)
        close_db_resource_safely(cursor)
        close_db_resource_safely(connection)


# INSERT / UPDATEなど、実行結果も必要なSQLを実行する関数
def execute(sql, params=None):
    if params is None:
        params = []

    connection = get_connection()
    cursor = None

    try:
        cursor = connection.cursor()
        cursor.execute(sql, params)
        # INSERT / UPDATE / DELETE が成功した場合だけ、DBへ確定する
        connection.commit()
        return {
            # 新規追加でも更新でも、LAST_INSERT_ID(id) の値を使えるようにする
            "insert_id": cursor.lastrowid,
            "rowcount": cursor.rowcount,
        }
    except Exception:
        # commit前に失敗した場合は、途中までの変更を残さないよう取り消す
        rollback_db_connection_safely(connection)
        raise
    finally:
        close_db_resource_safely(cursor)
        close_db_resource_safely(connection)


# importスクリプトの最後などで、DB接続を閉じるための関数
def close_pool():
    global connection_pool

    # mysql-connector-python のプールは使用後の接続を自動で戻すため、ここでは参照を外す
    connection_pool = None
