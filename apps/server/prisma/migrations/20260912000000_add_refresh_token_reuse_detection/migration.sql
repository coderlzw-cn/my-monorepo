-- 保留上一代 refresh token 哈希，用于检测令牌轮换后的重放行为。
ALTER TABLE `auth_session`
    ADD COLUMN `previous_token_hash` CHAR(64) NULL COMMENT '上一代 refresh token 的 SHA-256 哈希，用于检测已轮换令牌的重放',
    ADD UNIQUE INDEX `auth_session_previous_token_hash_key` (`previous_token_hash`);
