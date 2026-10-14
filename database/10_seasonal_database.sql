-- =====================================
-- 10. 食材マスタを管理するDB
-- ingredients
-- =====================================

-- 食材の基本情報を管理するテーブルです。
-- 食材名、カテゴリ、単位、アイコン情報などを保持します。
-- IF NOT EXISTS を使用しているため、既に存在する場合は再作成されません。

CREATE TABLE IF NOT EXISTS ingredients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    unit VARCHAR(20),
    icon VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 食材ごとの旬の時期（月別）を管理するテーブルです。
-- ingredients テーブルと外部キーで関連付けされます。
-- 1つの食材に対して複数の旬月を登録できます。

CREATE TABLE IF NOT EXISTS seasonal_ingredients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ingredient_id INT NOT NULL,
    month TINYINT NOT NULL,
    description TEXT,

    -- 月は1～12のみ許可
    CONSTRAINT chk_month
        CHECK (month BETWEEN 1 AND 12),

    -- 食材マスタとの関連付け
    CONSTRAINT fk_seasonal_ingredient
        FOREIGN KEY (ingredient_id)
        REFERENCES ingredients(id)
        ON DELETE CASCADE
);
