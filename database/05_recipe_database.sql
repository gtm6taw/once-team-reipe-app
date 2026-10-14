
-- =====================================
-- 05.レシピのデータを貯めて保存するテーブル
--recipe
-- =====================================
CREATE TABLE recipe (
    recipe_id   INT           NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100)  NOT NULL COMMENT 'レシピ名',
    main        VARCHAR(50)   NOT NULL COMMENT 'メイン食材',
    time        INT           NOT NULL COMMENT '調理時間（分）',
    diff        TINYINT       NOT NULL COMMENT '難易度（1〜5）',
    description    TEXT          NOT NULL COMMENT '説明文',
    ingredients JSON          NOT NULL COMMENT '材料リスト',
    steps       JSON          NOT NULL COMMENT '手順リスト',
    category    TINYINT       NOT NULL COMMENT 'カテゴリ（0：料理 or 1：時短料理）',
    PRIMARY KEY (recipe_id),
    INDEX idx_recipe_main (main),

    INDEX idx_recipe_name (name)
);