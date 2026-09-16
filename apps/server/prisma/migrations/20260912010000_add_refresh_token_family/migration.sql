-- 保存完整的 refresh token family；先回填现有哈希，再移除会话表中的单代哈希列。
CREATE TABLE `auth_refresh_token` (
    `id` VARCHAR(36) NOT NULL,
    `session_id` VARCHAR(36) NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `consumed_time` DATETIME(3) NULL,
    `expires_time` DATETIME(3) NOT NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `auth_refresh_token_hash_key` (`token_hash`),
    INDEX `auth_refresh_token_session_consumed_idx` (`session_id`, `consumed_time`),
    INDEX `auth_refresh_token_expires_time_idx` (`expires_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  COMMENT = 'Refresh Token 签发和消费历史，用于 Token family 重放检测';

INSERT INTO `auth_refresh_token` (`id`, `session_id`, `token_hash`, `consumed_time`, `expires_time`, `create_time`)
SELECT UUID(), `id`, `refresh_token_hash`, NULL, `expires_time`, `create_time`
FROM `auth_session`;

INSERT IGNORE INTO `auth_refresh_token` (`id`, `session_id`, `token_hash`, `consumed_time`, `expires_time`, `create_time`)
SELECT UUID(), `id`, `previous_token_hash`, `update_time`, `expires_time`, `create_time`
FROM `auth_session`
WHERE `previous_token_hash` IS NOT NULL;

ALTER TABLE `auth_refresh_token`
    ADD CONSTRAINT `auth_refresh_token_session_id_fkey`
    FOREIGN KEY (`session_id`) REFERENCES `auth_session` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `auth_session`
    ADD INDEX `auth_session_expires_time_idx` (`expires_time`),
    ADD INDEX `auth_session_revoked_time_idx` (`revoked_time`),
    ADD INDEX `auth_session_user_active_last_used_idx` (`user_id`, `revoked_time`, `last_used_time`),
    DROP INDEX `auth_session_refresh_token_hash_key`,
    DROP INDEX `auth_session_previous_token_hash_key`,
    DROP COLUMN `refresh_token_hash`,
    DROP COLUMN `previous_token_hash`;

CREATE TABLE `auth_job_lock` (
    `name` VARCHAR(64) NOT NULL,
    `owner` VARCHAR(36) NOT NULL,
    `expires_time` DATETIME(3) NOT NULL,

    INDEX `auth_job_lock_expires_time_idx` (`expires_time`),
    PRIMARY KEY (`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  COMMENT = '认证模块多实例定时任务租约锁';
