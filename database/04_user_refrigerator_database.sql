-- =========================================================
-- 4. ユーザの所有物を管理するデータベース
-- 
-- =========================================================

-- =====================================
-- カテゴリーテーブル
-- =====================================

CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(20) NOT NULL UNIQUE
);

-- =====================================
-- ユーザー所持食材テーブル
-- =====================================

CREATE TABLE user_ingredients (
    ingredient_id INT PRIMARY KEY AUTO_INCREMENT,
    
    user_id INT NOT NULL,
    category_id INT Not null,
    ingredient_name VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_user_ingredients
    foreign key (user_id) references users(user_id)
    on delete cascade,

    constraint fk_categories_user_ingredients
        FOREIGN KEY (category_id)
        REFERENCES categories(category_id)
        on update cascade
        ON DELETE RESTRICT,
    
    UNIQUE KEY uq_user_ingredient
    (user_id, ingredient_name)
);

-- =====================================
-- categories テーブル 初期データ
-- =====================================

INSERT INTO categories (category_name)
VALUES
('食材'),
('調味料');
