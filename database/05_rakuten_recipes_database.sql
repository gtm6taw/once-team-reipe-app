-- =========================================================
-- 5. 楽天レシピAPIから取得したレシピを保存するデータベース
-- Database: rakuten_recipes_db
-- =========================================================
--
-- このSQLは、楽天レシピAPIから取得できるカテゴリとランキングレシピを保存するための土台です。
-- 検索画面では外部APIを毎回呼ばず、このDBに保存済みのレシピを検索する想定です。
-- DB削除やテーブル削除を行うSQLは入れていません。

-- 楽天レシピ用のデータベースを作成する。
-- すでに同じ名前のDBがある場合は、既存DBをそのまま使う。
CREATE DATABASE IF NOT EXISTS rakuten_recipes_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

-- ここから下のテーブルは、楽天レシピ用DBの中に作成する。
USE rakuten_recipes_db;

-- =========================================================
-- 楽天レシピカテゴリ保存テーブル
-- =========================================================
-- 楽天カテゴリ一覧APIから取得できる、大カテゴリ・中カテゴリ・小カテゴリを保存する。
CREATE TABLE IF NOT EXISTS rakuten_recipe_categories (
  -- DB内でカテゴリを1件ずつ区別するためのID。
  id BIGINT AUTO_INCREMENT PRIMARY KEY,

  -- 楽天APIで使うカテゴリID。
  -- 小カテゴリは「大カテゴリ-中カテゴリ-小カテゴリ」の形で保存する。
  category_id VARCHAR(50) NOT NULL,

  -- 親カテゴリID。
  -- 大カテゴリのように親が無い場合はNULLにする。
  parent_category_id VARCHAR(50),

  -- large / medium / small のどれかを保存する。
  category_type VARCHAR(20) NOT NULL,

  -- 楽天APIから返るカテゴリ名。
  category_name VARCHAR(255) NOT NULL,

  -- 楽天レシピ上のカテゴリURL。
  category_url VARCHAR(1000),

  -- レコードを最初に保存した日時。
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- レコードを更新した日時。
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- 同じ楽天カテゴリを重複保存しないための一意キー。
  UNIQUE KEY uq_rakuten_recipe_categories_category_id (category_id),

  -- category_idからカテゴリを探しやすくするためのインデックス。
  INDEX idx_rakuten_recipe_categories_category_id (category_id),

  -- カテゴリ名で確認・検索しやすくするためのインデックス。
  INDEX idx_rakuten_recipe_categories_category_name (category_name)
);

-- =========================================================
-- 楽天レシピ本体保存テーブル
-- =========================================================
-- カテゴリ別ランキングAPIから取得できるレシピ情報を保存する。
CREATE TABLE IF NOT EXISTS rakuten_recipes (
  -- DB内でレシピを1件ずつ区別するためのID。
  id BIGINT AUTO_INCREMENT PRIMARY KEY,

  -- 楽天APIからレシピIDが取れる場合に保存する。
  -- 取得できない場合もあるためNULLを許可する。
  rakuten_recipe_id VARCHAR(100),

  -- レシピ名。
  recipe_title VARCHAR(255) NOT NULL,

  -- 楽天レシピ詳細ページのURL。
  recipe_url VARCHAR(1000) NOT NULL,

  -- レシピ画像URL。
  food_image_url VARCHAR(1000),

  -- 中サイズ画像URL。
  medium_image_url VARCHAR(1000),

  -- 小サイズ画像URL。
  small_image_url VARCHAR(1000),

  -- レシピ説明文。
  recipe_description TEXT,

  -- 材料リストをJSON文字列として保存する。
  -- MySQL 8系ならJSON型として扱える。
  recipe_material_json JSON,

  -- 調理時間の目安。
  recipe_indication VARCHAR(100),

  -- 費用の目安。
  recipe_cost VARCHAR(100),

  -- 楽天APIから返る公開日。
  recipe_publishday VARCHAR(100),

  -- pickupフラグ。
  pickup INT DEFAULT 0,

  -- 楽天APIから返るショップ情報。
  shop VARCHAR(255),

  -- 投稿者名。
  nickname VARCHAR(255),

  -- レシピ名、材料、カテゴリ名、説明文をまとめた検索用文字列。
  search_text TEXT,

  -- ひらがな寄せ・小文字化・同義語追加をした検索用文字列。
  normalized_search_text TEXT,

  -- データ取得元。今回は rakuten を保存する。
  source VARCHAR(50) NOT NULL DEFAULT 'rakuten',

  -- 楽天APIから最後に取得した日時。
  fetched_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- レコードを最初に保存した日時。
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- レコードを更新した日時。
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- 楽天レシピIDがある場合は、同じレシピを重複保存しない。
  UNIQUE KEY uq_rakuten_recipes_rakuten_recipe_id (rakuten_recipe_id),

  -- 楽天レシピIDが無い場合でも、URLで重複を防ぐ。
  UNIQUE KEY uq_rakuten_recipes_recipe_url (recipe_url),

  -- 検索APIで使う検索用文字列の先頭部分にインデックスを付ける。
  -- 最初はLIKE検索で実装し、データ量が増えたら全文検索などへ改善できる。
  INDEX idx_rakuten_recipes_normalized_search_text (normalized_search_text(255)),

  -- 取得日が新しい順に並べやすくするためのインデックス。
  INDEX idx_rakuten_recipes_fetched_at (fetched_at)
);

-- =========================================================
-- 楽天レシピとカテゴリの対応テーブル
-- =========================================================
-- 同じレシピが複数カテゴリのランキングに出る可能性があるため、対応表として分けて保存する。
CREATE TABLE IF NOT EXISTS rakuten_recipe_category_map (
  -- DB内で対応関係を1件ずつ区別するためのID。
  id BIGINT AUTO_INCREMENT PRIMARY KEY,

  -- rakuten_recipes.id を保存する。
  recipe_id BIGINT NOT NULL,

  -- rakuten_recipe_categories.id を保存する。
  category_id BIGINT NOT NULL,

  -- カテゴリ別ランキングでの順位。
  rank_position INT,

  -- レコードを最初に保存した日時。
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- レコードを更新した日時。
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- 同じレシピとカテゴリの組み合わせを重複保存しない。
  UNIQUE KEY uq_rakuten_recipe_category_map_recipe_category (recipe_id, category_id),

  -- レシピからカテゴリ対応を探しやすくするためのインデックス。
  INDEX idx_rakuten_recipe_category_map_recipe_id (recipe_id),

  -- カテゴリからレシピ対応を探しやすくするためのインデックス。
  INDEX idx_rakuten_recipe_category_map_category_id (category_id),

  -- レシピが消えた場合、対応表だけ残らないようにする。
  FOREIGN KEY (recipe_id)
    REFERENCES rakuten_recipes(id)
    ON DELETE CASCADE,

  -- カテゴリが消えた場合、対応表だけ残らないようにする。
  FOREIGN KEY (category_id)
    REFERENCES rakuten_recipe_categories(id)
    ON DELETE CASCADE
);
