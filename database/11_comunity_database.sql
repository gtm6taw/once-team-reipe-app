
-- ===============================
-- 投稿テーブル
-- ===============================
CREATE TABLE posts (
post_id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT NOT NULL,
recipe_id INT NOT NULL,
photo_url VARCHAR(255),
post_coment VARCHAR(255),
posted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
cooking_time_category_id INT,
FOREIGN KEY (user_id) REFERENCES users(user_id),
FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id),
FOREIGN KEY (cooking_time_category_id) REFERENCES cooking_time_categories(cooking_time_category_id)
);

- ===============================
-- 履歴テーブル(作った料理を保存するテーブル)
-- ===============================
CREATE TABLE history (
history_id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT NOT NULL,
recipe_id INT NOT NULL,
photo_url VARCHAR(255),
rating_score DECIMAL(3,1),
cooked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(user_id),
FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id)
);




-- ===============================
-- いいねテーブル
-- ===============================
CREATE TABLE likes (
post_id INT NOT NULL,
user_id INT NOT NULL,
liked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (post_id, user_id),
FOREIGN KEY (post_id) REFERENCES posts(post_id),
FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ===============================
-- 調理時間区分マスタ
-- ===============================
CREATE TABLE cooking_time_categories (
    cooking_time_category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name            VARCHAR(50) NOT NULL,
    min_minutes               INT,
    max_minutes               INT
);

-- ===============================
-- 調理時間区分 INSERT
-- ===============================
INSERT INTO cooking_time_categories (cooking_time_category_id, category_name, min_minutes, max_minutes) VALUES
(1, '1分〜5分',   1,  5),
(2, '5分〜10分',  6,  10),
(3, '10分〜15分', 11, 15),
(4, '15分〜20分', 16, 20),
(5, '20分〜30分', 21, 30),
(6, '30分〜40分', 31, 40),
(7, '40分〜50分', 41, 50),
(8, '50分〜60分', 51, 60),
(9, '60分〜',     61, NULL);
