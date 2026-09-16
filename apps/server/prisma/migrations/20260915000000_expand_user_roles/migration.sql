-- 将既有 ADMIN 用户提升为 SUPER_ADMIN，保持原有最高权限语义。
ALTER TABLE `user`
    MODIFY COLUMN `role` ENUM('SUPER_ADMIN', 'ADMIN', 'USER', 'GUEST') NOT NULL DEFAULT 'USER'
    COMMENT '用户角色：SUPER_ADMIN 超级管理员 / ADMIN 管理员 / USER 用户 / GUEST 游客';

UPDATE `user`
SET `role` = 'SUPER_ADMIN'
WHERE `role` = 'ADMIN';
