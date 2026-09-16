import type { SidebarNavItem } from "@/layout/nav-main";

import type { RouteObject } from "@/types/router";

/**
 * 根据路由配置递归构建侧边栏导航。
 *
 * - 自动解析嵌套路由的完整路径；
 * - `index: true` 继承父级路径；
 * - 没有 `handle.nav` 的路由不会生成菜单，但会继续处理其子路由；
 * - 根据 `handle.roles` 过滤当前角色无权访问的菜单；
 * - 忽略 `*` 等通配符路由；
 * - 存在可见子菜单时，父菜单默认指向第一个子菜单。
 */
export function buildSidebarNav(routes: RouteObject[], parentPath = "/", systemRoleKey?: string): SidebarNavItem[] {
  const items: SidebarNavItem[] = [];

  for (const route of routes) {
    // 未取得角色时默认隐藏受限入口，避免登录后短暂闪现无权菜单。
    if (route.handle?.roles && systemRoleKey && !route.handle.roles.some((role) => role === systemRoleKey)) {
      continue;
    }

    // 解析当前路由的完整路径：
    // - index 路由继承父级路径；
    // - 绝对路径直接使用；
    // - 相对路径拼接到父级路径。
    let path = parentPath || "/";

    if (!route.index && route.path) {
      if (route.path.startsWith("/")) {
        path = route.path;
      } else {
        const base = parentPath.endsWith("/") ? parentPath.slice(0, -1) : parentPath;

        path = `${base}/${route.path}`;
      }
    }

    // 通配符路由通常用于 404 等兜底页面，不应出现在侧边栏。
    if (path.includes("*")) {
      continue;
    }

    const handle = route.handle;

    // 递归构建当前路由下可显示的子菜单。
    const childItems = route.children ? buildSidebarNav(route.children, path, systemRoleKey) : [];

    // 当前路由未配置导航信息时不生成菜单，
    // 但保留其子菜单，例如仅用于布局或路由分组的父级路由。
    if (!handle?.nav) {
      items.push(...childItems);
      continue;
    }

    // 存在子菜单时生成菜单分组，父菜单默认跳转到第一个子菜单。
    if (childItems.length > 0) {
      items.push({
        icon: handle.nav.icon,
        items: childItems.map((child) => ({
          title: child.title,
          url: child.url,
        })),
        title: handle.nav.title,
        url: childItems[0].url,
      });

      continue;
    }

    // 没有子菜单时生成普通导航项。
    items.push({
      icon: handle.nav.icon,
      title: handle.nav.title,
      url: path,
    });
  }

  return items;
}
