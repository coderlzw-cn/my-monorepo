/**
 * 系统内置角色的唯一来源。
 *
 * key 用于权限判断，其他字段用于展示和创建内置角色记录；前后端均从这里引用，
 * 以避免接口角色标识与路由权限判断出现偏差。
 */
export const SYSTEM_ROLES = {
  SUPER_ADMIN: { key: "SUPER_ADMIN", label: "超级管理员", description: "拥有系统全部权限", builtin: true },
  ADMIN: { key: "ADMIN", label: "管理员", description: "拥有系统管理权限", builtin: true },
  USER: { key: "USER", label: "普通用户", description: "默认注册用户", builtin: true },
  GUEST: { key: "GUEST", label: "游客", description: "只读访客用户", builtin: true },
} as const;

export type SystemRoleKey = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES]["key"];

export const SYSTEM_ROLE_KEYS = Object.keys(SYSTEM_ROLES) as SystemRoleKey[];
