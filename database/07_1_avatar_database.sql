- # アバターマスターテーブル

- アバターID
- 進化先アバターID
- 種別
- 名前
- アバター画像URL
- 金額
- レベル上限
- 販売状況
- 購入で入手できるか
- 進化に必要なレベル

CREATE TABLE avatars (
  avatar_id        		INT AUTO_INCREMENT PRIMARY KEY,
  evolves_to_avatar_id 	INT NULL,
  rarity_id		   		INT NOT NULL,
  avatar_name      		VARCHAR(100) NOT NULL UNIQUE,
  image_path       		VARCHAR(255) NOT NULL,
  required_points  		INT NOT NULL CHECK (required_points >= 0),
  max_level        		INT NOT NULL DEFAULT 100,
  is_active        		BOOLEAN NOT NULL DEFAULT TRUE,
  is_purchasable   		BOOLEAN NOT NULL DEFAULT TRUE,   -- FALSE: 進化でのみ入手可                 
  evolve_level     		INT NULL,                        -- 進化先がない場合はNULL
  
  CONSTRAINT fk_avatars_rarity
    FOREIGN KEY (rarity_id)
    REFERENCES rarities(rarity_id),
  
  CONSTRAINT fk_avatars_evolves_to
    FOREIGN KEY (evolves_to_avatar_id)
    REFERENCES avatars(avatar_id)
    ON DELETE SET NULL
);

- # レアリティマスタテーブル

CREATE TABLE rarities (
  rarity_id   INT PRIMARY KEY,
  rarity_name VARCHAR(20) NOT NULL UNIQUE
);


- # ユーザ保有テーブル

- ID
- ユーザID
- アバターID
- レベル
- レベルアップに必要な経験値
- 取得日時
- 更新日時

CREATE TABLE user_avatars (
  user_avatar_id   INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  avatar_id        INT NOT NULL,
  level            INT NOT NULL DEFAULT 1 CHECK (level >= 1),
  exp              INT NOT NULL DEFAULT 0 CHECK (exp >= 0 AND exp < 100),
  is_equipped      BOOLEAN NOT NULL DEFAULT FALSE,
  obtained_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  
  CONSTRAINT fk_user_avatars_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id),

  CONSTRAINT fk_user_avatars_avatar
    FOREIGN KEY (avatar_id)
    REFERENCES avatars(avatar_id)
);


- # 購入履歴

CREATE TABLE avatar_purchase_history (
  avatar_purchase_id  INT AUTO_INCREMENT PRIMARY KEY,   	-- アバター購入履歴ID
  user_id             INT NOT NULL,                        	-- ユーザーID
  avatar_id           INT NOT NULL,                        	-- アバターID
  price_paid          INT NOT NULL CHECK (price_paid >= 0),	-- 使用したポイント マイナス禁止
  purchased_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_avatar_history_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id),

  CONSTRAINT fk_avatar_history_avatar
    FOREIGN KEY (avatar_id)
    REFERENCES avatars(avatar_id)
);