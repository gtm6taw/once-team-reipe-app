-- =====================================
-- 00.ユーザー情報を管理するDB
--users 
-- =====================================

-- すでに users テーブルがある環境でも、同じSQLを安全に再確認できるようにします。
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    delicious_points INT NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    streak_cook_day INT NOT NULL DEFAULT 0
);
