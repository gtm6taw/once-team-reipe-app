-- =========================================================
-- 1. ユーザーが作った料理・献立を保存するデータベース
-- Database: mirunavi_db
-- =========================================================

-- CREATE DATABASE IF NOT EXISTS user_menus_db
--   DEFAULT CHARACTER SET utf8mb4
--   DEFAULT COLLATE utf8mb4_0900_ai_ci;

--USE user_menus_db; mirunavi_appのDBで行うため不要とします。

CREATE TABLE IF NOT EXISTS user_menus (
  menu_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT  NOT NULL,
  menu_title VARCHAR(100) NOT NULL,--「xx月yy日の献立」と保存する？
  dish_name VARCHAR(100) NOT NULL,--料理名
  ingredients TEXT,
  recipe TEXT,
  image_url VARCHAR(500),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_menus_user
  FOREIGN KEY (user_id)
  REFERENCES users(user_id)
  ON DELETE CASCADE,

  INDEX idx_user_menus_user(user_id)
);
--※撮った料理を保存するのか、参考にしたりょりの画像を保存するのか
