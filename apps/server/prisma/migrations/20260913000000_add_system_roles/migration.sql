-- Add the immutable system-role catalogue separately from editable business roles.
CREATE TABLE `system_role` (
    `id` VARCHAR(36) NOT NULL,
    `key` VARCHAR(64) NOT NULL,
    `label` TEXT NOT NULL,
    `description` VARCHAR(1024) NOT NULL DEFAULT '',
    `builtin` BOOLEAN NOT NULL DEFAULT false,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_role_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `system_role` (`id`, `key`, `label`, `description`, `builtin`, `update_time`)
VALUES
    (UUID(), 'SUPER_ADMIN', '超级管理员', '拥有系统全部权限', true, CURRENT_TIMESTAMP(3)),
    (UUID(), 'ADMIN', '管理员', '拥有系统管理权限', true, CURRENT_TIMESTAMP(3)),
    (UUID(), 'USER', '普通用户', '默认注册用户', true, CURRENT_TIMESTAMP(3)),
    (UUID(), 'GUEST', '访客', '只读访客用户', true, CURRENT_TIMESTAMP(3));

ALTER TABLE `user`
    ADD COLUMN `system_role_id` VARCHAR(36) NULL,
    ADD COLUMN `disabled` BOOLEAN NOT NULL DEFAULT false;

-- Preserve existing authorization semantics while assigning every existing user.
UPDATE `user` AS `u`
JOIN `system_role` AS `sr`
  ON `sr`.`key` = CASE WHEN `u`.`role` = 'ADMIN' THEN 'SUPER_ADMIN' ELSE 'USER' END
SET `u`.`system_role_id` = `sr`.`id`;

ALTER TABLE `user`
    MODIFY `system_role_id` VARCHAR(36) NOT NULL,
    ADD INDEX `user_system_role_id_idx`(`system_role_id`),
    ADD CONSTRAINT `user_system_role_id_fkey`
      FOREIGN KEY (`system_role_id`) REFERENCES `system_role`(`id`)
      ON DELETE RESTRICT ON UPDATE CASCADE;
