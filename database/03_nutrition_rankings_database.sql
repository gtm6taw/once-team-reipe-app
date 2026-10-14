-- =========================================================
-- 3. 料理の栄養を基準にしたランキング用データベース
-- Database: mirunavi_db
--user_postsテーブルを基にランキングを作成
--ランキングはテーブルに保存するより、バックエンドで取得する方法もあるため要検討。
--そのため、このテーブルは使わない可能性あり

--(前案)ランキングのテーブルは更新する前にすべて削除したうえでデータを追加する
--ランキング集計の周期は未定
-- =========================================================

-- CREATE DATABASE IF NOT EXISTS nutrition_rankings_db
--   DEFAULT CHARACTER SET utf8mb4
--   DEFAULT COLLATE utf8mb4_0900_ai_ci;

--USE nutrition_rankings_db;mirunavi_appのDBで行うため不要とします。

CREATE TABLE IF NOT EXISTS nutrition_rankings (
  rank_id INT AUTO_INCREMENT PRIMARY KEY,
  user_post_id BIGINT 
  foreign user_post_id references user_posts(post_id),
  calories DECIMAL(8,2) DEFAULT 0,
  protein DECIMAL(8,2) DEFAULT 0,
  fat DECIMAL(8,2) DEFAULT 0,
  carbohydrate DECIMAL(8,2) DEFAULT 0,
  salt DECIMAL(8,2) DEFAULT 0,
  nutrition_score DECIMAL(6,2) DEFAULT 0,
  -- rank_position INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
