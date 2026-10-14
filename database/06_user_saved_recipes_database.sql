-- =========================================================
-- 06. ユーザーが保存した外部レシピを管理するテーブル
-- =========================================================
-- このSQLは、FatSecret、楽天レシピ、TheMealDBなどの外部APIから取得したレシピを、
-- 「どのユーザーが保存したか」と一緒に管理するための設計です。
--
-- frontendからMySQLへ直接つなぐのではなく、
-- 次のPRで作るFlask backend APIからこのテーブルへ保存します。
--
-- 実行前に、00_user_info_database.sql の users テーブルが
-- 同じDB内に作成されている必要があります。
--
-- users テーブルの主キーは user_id です。
-- そのため、このテーブルの user_id は users(user_id) を参照します。
-- =========================================================

CREATE TABLE IF NOT EXISTS user_saved_recipes (
  -- 保存したレシピを1件ずつ区別するためのIDです。
  id BIGINT AUTO_INCREMENT PRIMARY KEY,

  -- どのユーザーが保存したレシピかを表します。
  -- 既存の users テーブルでは user_id が主キーなので、その型に合わせています。
  user_id INT NOT NULL,

  -- 検索した時に使ったキーワードを保存します。
  -- 例：卵、鶏肉、chicken など。
  keyword VARCHAR(255) NOT NULL DEFAULT '',

  -- どの外部APIから取得したレシピかを表します。
  -- 例：fatsecret、rakuten、themealdb など。
  source_api VARCHAR(50) NOT NULL,

  -- 外部API側のレシピIDです。
  -- 同じユーザーが同じ外部レシピを重複保存しないために使います。
  external_recipe_id VARCHAR(255) NOT NULL,

  -- 画面に表示するレシピ名です。
  -- 外部APIから返ってきたレシピ名、またはbackend側で整えたレシピ名を保存します。
  recipe_title VARCHAR(255) NOT NULL,

  -- 画面に表示するレシピ画像URLです。
  -- 画像がないレシピもあるため、NULLを許可します。
  recipe_image_url VARCHAR(1000),

  -- レシピ詳細ページのURLです。
  -- 外部サイト、またはbackend側で用意した詳細URLを保存します。
  recipe_detail_url VARCHAR(1000),

  -- 材料リストをJSON形式で保存します。
  -- 例：["卵", "ごはん", "しょうゆ"] のような形を想定しています。
  ingredients_json JSON,

  -- 画面に表示する調理時間の目安です。
  estimated_time_ja VARCHAR(100),

  -- 画面に表示する費用目安です。
  estimated_cost_ja VARCHAR(100),

  -- レシピを保存した日時です。
  saved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- 同じユーザーが同じ外部レシピを二重に保存しないための制約です。
  UNIQUE KEY uq_user_saved_recipes_user_source_external (
    user_id,
    source_api,
    external_recipe_id
  ),

  -- ユーザーごとの保存一覧を取り出しやすくするための索引です。
  -- saved_at も含めることで、新しく保存した順に並べやすくします。
  KEY idx_user_saved_recipes_user_saved_at (user_id, saved_at),

  -- 外部APIと外部レシピIDから探しやすくするための索引です。
  KEY idx_user_saved_recipes_source_external (
    source_api,
    external_recipe_id
  ),

  -- users.user_id を親として、保存レシピをユーザーに紐づけます。
  -- ON DELETE CASCADE は削除命令ではなく、親ユーザーが消えた場合の整理ルールです。
  CONSTRAINT fk_user_saved_recipes_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;
