-- =========================================================
-- 2. ユーザーが投稿したものを保存するデータベース
-- Database: mirunavi_db
-- =========================================================

-- CREATE DATABASE IF NOT EXISTS user_posts_db
--   DEFAULT CHARACTER SET utf8mb4
--   DEFAULT COLLATE utf8mb4_0900_ai_ci;

-- USE user_posts_db;
-- mirunavi_appのDBで行うため不要とします。


CREATE TABLE IF NOT EXISTS user_posts (
  post_id BIGINT AUTO_INCREMENT  PRIMARY KEY,
  user_id INT not null ,
  menu_id BIGINT not null
  ,
  post_title VARCHAR(100) NOT NULL,--デフォルトでuser_menuのdish_nameでもよい、フロント→バックで変更可にさせたい
  post_content TEXT,
  image_url VARCHAR(500),--画像はuser_menuテーブルから副問い合わせで追加してもよいかも
  nutrition_score DECIMAL(6,2) DEFAULT 0,
  upload_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  constraint fk_user_posts_users
  foreign key (user_id) references users(user_id)
  on delete cascade,

  constraint fk_user_posts_user_menus
  foreign key (menu_id) references user_menus(menu_id)
  on delete cascade,
  
  INDEX idx_user_posts_user(user_id),

  INDEX idx_user_posts_menu(menu_id)

  
);
