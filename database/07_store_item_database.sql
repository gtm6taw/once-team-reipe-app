-- =========================================================
-- キャラクターストアのデータベース
-- =========================================================

CREATE DATABASE IF NOT EXISTS store_item_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

--USE store_item_db; mirunavi_appのDBで行うため不要とします。

-- アイテム種別マスター
CREATE TABLE item_types (
  item_type_id    INT AUTO_INCREMENT  PRIMARY KEY,		-- アイテム種別ID
  item_type_name  VARCHAR(50) NOT NULL UNIQUE			-- アイテム種別名
);

-- アイテムマスター
CREATE TABLE items (
  item_id         INT AUTO_INCREMENT PRIMARY KEY,				-- アイテムID
  item_name       VARCHAR(100) NOT NULL,						-- アイテム名
  item_type_id    INT NOT NULL,									-- アイテム種別ID
  image_path      VARCHAR(255) NOT NULL,      -- アイテム画像
  icon            VARCHAR(255) NOT NULL,      -- アイコン
  required_points INT NOT NULL CHECK (required_points >= 0),	-- 必要ポイント
  is_active		  BOOLEAN NOT NULL DEFAULT TRUE,				-- 販売状態 TRUE:販売中 FALSE:販売停止

  -- 同一種別内で名前重複禁止したい場合
  UNIQUE KEY uq_items_name_type (item_name, item_type_id),

  CONSTRAINT fk_items_item_type
    FOREIGN KEY (item_type_id)            -- 外部キー
    REFERENCES item_types(item_type_id)   -- アイテム種別を参照   
    ON UPDATE CASCADE   -- 参照元を変更した場合，参照先も反映する
    ON DELETE RESTRICT  -- 参照先が存在する場合，削除不可
);

-- 購入履歴
CREATE TABLE purchase_history (
  purchase_id    BIGINT AUTO_INCREMENT PRIMARY KEY,		-- 購入履歴ID
  user_id        INT NOT NULL,							-- ユーザーID
  item_id        INT NOT NULL,							-- アイテムID
  price_paid     INT NOT NULL CHECK (price_paid >= 0),  -- 使用ポイント マイナス禁止
  purchased_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_purchase_history
    foreign key(user_id)
    references users(user_id)
    on update cascade,
    FOREIGN KEY (item_id)
    REFERENCES items(item_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  -- 検索用
  INDEX idx_purchase_user (user_id),
  INDEX idx_purchase_item (item_id),
  INDEX idx_purchase_date (purchased_at)
);

-- ユーザー所持アイテム
CREATE TABLE user_inventory (
  inventory_id  BIGINT AUTO_INCREMENT PRIMARY KEY,         		-- 所持ID
  user_id       INT NOT NULL,                              		-- ユーザーID
  item_id       INT NOT NULL,                              		-- アイテムID
  obtained_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,	-- 取得日時

  UNIQUE KEY uq_inventory_user_item (user_id, item_id),   -- 重複所持禁止 
  CONSTRAINT fk_inventory_item
  foreign key(user_id)
    references users(user_id)
    on update cascade,
    FOREIGN KEY (item_id)
    REFERENCES items(item_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  INDEX idx_inventory_user (user_id),
  INDEX idx_inventory_item (item_id)
);
