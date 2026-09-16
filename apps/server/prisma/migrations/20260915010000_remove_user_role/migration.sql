-- 系统角色已由 user.system_role_id 关联的 system_role.key 唯一表示。
ALTER TABLE `user` DROP COLUMN `role`;
