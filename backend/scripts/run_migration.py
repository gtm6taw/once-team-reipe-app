#!/usr/bin/env python3
"""DBマイグレーション実行スクリプト

使用方法:
    python scripts/run_migration.py --file db_migrations/001_create_users_table.sql

環境変数（必須）:
    DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
"""

import argparse
import os
import sys

# 親ディレクトリ（プロジェクトルート）を sys.path に追加して db.py を import 可能にする
script_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(script_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from db import get_pool


def main():
    parser = argparse.ArgumentParser(description="DBマイグレーション実行スクリプト")
    parser.add_argument("--file", required=True, help="実行するSQLファイルのパス")
    args = parser.parse_args()

    # 必須環境変数のチェック
    required_envs = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"]
    missing = [env for env in required_envs if not os.getenv(env)]
    if missing:
        print(f"エラー: 以下の環境変数が未設定です: {', '.join(missing)}", file=sys.stderr)
        sys.exit(1)

    sql_file_path = args.file
    if not os.path.isfile(sql_file_path):
        print(f"エラー: 指定されたSQLファイルが見つかりません: {sql_file_path}", file=sys.stderr)
        sys.exit(1)

    # SQLファイルの読み込み
    try:
        with open(sql_file_path, "r", encoding="utf-8") as f:
            sql_content = f.read()
    except Exception as e:
        print(f"エラー: SQLファイルの読み込みに失敗しました: {e}", file=sys.stderr)
        sys.exit(1)

    if not sql_content.strip():
        print("エラー: SQLファイルが空です。", file=sys.stderr)
        sys.exit(1)

    # DB接続プール取得（db.py の既存関数を再利用）
    try:
        pool = get_pool()
    except Exception as e:
        print(f"エラー: DB接続プールの取得に失敗しました: {e}", file=sys.stderr)
        sys.exit(1)

    connection = None
    cursor = None
    try:
        connection = pool.get_connection()
        cursor = connection.cursor()

        # 複数のSQL文が含まれる場合にも対応（mysql-connector-python の multi=True）
        for result in cursor.execute(sql_content, multi=True):
            pass  # 結果を消費して実行を完了させる

        connection.commit()
        print(f"成功: {sql_file_path} のマイグレーションを完了しました。")
    except Exception as e:
        if connection:
            try:
                connection.rollback()
            except Exception:
                pass
        print(f"エラー: マイグレーション実行中に失敗しました: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        if cursor:
            try:
                cursor.close()
            except Exception:
                pass
        if connection:
            try:
                connection.close()
            except Exception:
                pass


if __name__ == "__main__":
    main()
