import { lazy } from "react";
import { createBrowserRouter, Outlet } from "react-router";
import RouteError from "@/components/RouteError";
import { ROUTES } from "@/constants/routes";
import { SYSTEM_ROLES } from "@workspace/common/constants/enum.constants";
import BaseLayout from "@/layout";
import { authGuard, guestGuard, roleGuard } from "@/router/guards";
import type { RouteObject } from "@/types/router";
import { RiApps2Line, RiDashboardLine } from "@remixicon/react";

const LoginPage = lazy(() => import("@/pages/login"));
const RegisterPage = lazy(() => import("@/pages/register"));
const InitializePage = lazy(() => import("@/pages/initialize"));
const ProfilePage = lazy(() => import("@/pages/profile/ProfilePage"));

// system
const UserPage = lazy(() => import("@/pages/system/users/UsersPage"));
const SystemRolePage = lazy(() => import("@/pages/system/system-roles/SystemRolesPage"));
const BusinessRolesPage = lazy(() => import("@/pages/system/business-roles/BusinessRolesPage"));
export const layoutRoutes: RouteObject[] = [
  {
    index: true,
    element: "仪表盘",
    handle: { nav: { title: "仪表盘", icon: RiDashboardLine } },
  },
  {
    path: ROUTES.VERSION,
    element: "版本管理",
    handle: { nav: { title: "版本管理", icon: RiDashboardLine } },
  },
  roleGuard([SYSTEM_ROLES.SUPER_ADMIN.key, SYSTEM_ROLES.ADMIN.key], {
    Component: Outlet,
    handle: { nav: { title: "系统管理", icon: RiApps2Line } },
    children: [
      roleGuard([SYSTEM_ROLES.SUPER_ADMIN.key, SYSTEM_ROLES.ADMIN.key], {
        path: ROUTES.USERS,
        Component: UserPage,

        handle: { nav: { title: "用户管理", icon: RiDashboardLine } },
      }),
      roleGuard(SYSTEM_ROLES.SUPER_ADMIN.key, {
        path: ROUTES.SYSTEM_ROLES,
        Component: BusinessRolesPage,

        handle: { nav: { title: "角色权限", icon: RiDashboardLine } },
      }),
      roleGuard([SYSTEM_ROLES.SUPER_ADMIN.key, SYSTEM_ROLES.ADMIN.key], {
        path: ROUTES.BUSINESS_ROLES,
        Component: SystemRolePage,

        handle: { nav: { title: "系统权限", icon: RiDashboardLine } },
      }),
    ],
  }),
];

const router = createBrowserRouter(
  [
    {
      path: ROUTES.LOGIN,
      loader: guestGuard,
      // 给路由加了异步 loader（authGuard / guestGuard 要请求 /auth/profile）之后，首次加载页面时，router 必须等 loader 执行完才能渲染路由组件。在这段等待时间里，router 需要渲染一个"初始加载占位"（HydrateFallback）。你没有提供，所以这段时间页面是空白的，react-router 提示你最好补一个。
      HydrateFallback: () => null,
      Component: LoginPage,
    },
    {
      path: ROUTES.REGISTER,
      // 已登录且令牌有效时直接进首页
      loader: guestGuard,
      HydrateFallback: () => null,
      Component: RegisterPage,
    },
    {
      path: ROUTES.INITIALIZE,
      // 系统已初始化时不允许再进入，跳回登录页
      // loader: initGuard,
      HydrateFallback: () => null,
      Component: InitializePage,
    },
    {
      path: ROUTES.PROFILE,
      loader: authGuard,
      HydrateFallback: () => null,
      Component: ProfilePage,
    },
    {
      path: ROUTES.HOME,
      loader: authGuard,
      Component: BaseLayout,
      ErrorBoundary: RouteError,
      HydrateFallback: () => "loading.........",
      children: layoutRoutes,
    },
  ] satisfies RouteObject[],
  { basename: import.meta.env.BASE_URL },
);

export default router;
