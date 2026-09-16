import { type LoaderFunctionArgs, redirect } from "react-router";

import { ROUTES } from "@/constants/routes";
import type { SystemRoleKey } from "@workspace/common/constants/enum.constants";

import { useAuthStore } from "@/stores/auth.store";
import { queryClient } from "@/services/queryClient";
import { getProfileGetProfileQueryKey, getProfileGetProfileQueryOptions } from "@/services/generated";
import type { RouteObject } from "@/types/router";

/** 校验本地令牌是否有效，并把用户信息写入 Store。 */
async function verifyToken() {
  try {
    const profile = await queryClient.query(getProfileGetProfileQueryOptions());

    useAuthStore.getState().setProfile(profile);
    return true;
  } catch {
    useAuthStore.getState().setProfile(null);
    queryClient.removeQueries({ queryKey: getProfileGetProfileQueryKey() });
    return false;
  }
}

/** 登录或注册页守卫：已有有效 token 时直接进入目标页或首页。 */
export async function guestGuard({ request }: LoaderFunctionArgs) {
  const { tokens } = useAuthStore.getState();

  if (tokens?.accessToken && (await verifyToken())) {
    const from = new URL(request.url).searchParams.get("from");
    return redirect(from?.startsWith("/") ? from : ROUTES.HOME);
  }
  return null;
}

/** 受保护路由守卫：无 token 或 token 无效时跳转登录页。 */
export async function authGuard({ request }: LoaderFunctionArgs) {
  const { tokens } = useAuthStore.getState();

  if (!tokens?.accessToken || !(await verifyToken())) {
    const url = new URL(request.url);
    const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
    const pathname = url.pathname.startsWith(basePath) ? url.pathname.slice(basePath.length) || ROUTES.HOME : url.pathname;
    const from = pathname + url.search;
    return redirect(`${ROUTES.LOGIN}?from=${encodeURIComponent(from)}`);
  }
  return null;
}

/**
 * 系统角色守卫：先校验登录态，再按数据库系统角色标识限制页面访问。
 *
 * 未登录或令牌失效时沿用 authGuard 跳转登录页；用户已登录但角色不匹配时
 * 抛出 404，避免向无权限用户暴露受限页面是否存在。
 */
export function roleGuard(requiredRoles: SystemRoleKey | readonly SystemRoleKey[], route: RouteObject): RouteObject {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return {
    ...route,
    handle: { ...route.handle, roles },
    loader: async (args: LoaderFunctionArgs) => {
      const authResult = await authGuard(args);
      if (authResult) return authResult;

      const profile = useAuthStore.getState().profile;
      if (!profile || !roles.some((role) => role === profile.systemRole.key)) {
        throw new Response(null, { status: 404, statusText: "Not Found" });
      }

      return null;
    },
  };
}
