import type { RemixiconComponentType } from "@remixicon/react";
import type { IndexRouteObject as ReactRouterIndexRouteObject, NonIndexRouteObject as ReactRouterNonIndexRouteObject } from "react-router";
import type { SystemRoleKey } from "@workspace/common/constants/enum.constants";

type RouteHandle = {
  /** 可访问该路由的系统角色，同时用于访问守卫和侧边栏过滤。 */
  roles?: readonly SystemRoleKey[];
  nav?: {
    title: string;
    icon?: RemixiconComponentType;
  };
};

/** 保留 React Router 路由定义，仅收窄其 handle 类型。 */
type WithRouteHandle<T> = Omit<T, "handle"> & {
  handle?: RouteHandle;
};

type IndexRouteObject = WithRouteHandle<ReactRouterIndexRouteObject>;

type NonIndexRouteObject = Omit<WithRouteHandle<ReactRouterNonIndexRouteObject>, "children"> & {
  children?: RouteObject[];
};

export type RouteObject = IndexRouteObject | NonIndexRouteObject;
