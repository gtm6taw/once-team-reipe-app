# みるナビ backend

みるナビのPython / FlaskバックエンドAPIです。

このbackendは、ユーザー登録・ログイン、プロフィール管理、所持食材管理、保存済みレシピ管理、DBレシピ検索を担当します。

楽天API、FatSecret API、Ollama、Gemini、Cloudflare画像生成は現在使用しません。

## ローカル実行

1. 依存をインストール

	python -m pip install -r requirements.txt

2. サーバー起動

	python app.py

3. 動作確認

	- GET /: フロント画面が表示される
	- GET /api/health: ok が true で返る
	- GET /api/recipes/search?keyword=卵: DB検索結果またはテーブル未作成メッセージが返る

## GitHub に push して使うとき

- このリポジトリは Render 前提ではなく、ローカルまたは任意環境での Flask 実行を前提にしています。
- クローン先で requirements.txt をインストールし、python app.py で起動してください。
- DBを使う場合は環境変数を設定してください。

主なDB環境変数:

- DB_HOST
- DB_PORT
- DB_USER
- DB_PASSWORD
- DB_NAME