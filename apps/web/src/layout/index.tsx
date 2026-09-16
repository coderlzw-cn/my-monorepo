import { AppSidebar } from "@/layout/app-sidebar";
import { Outlet } from "react-router";
import { NavUser } from "./nav-user";
import { Link, useMatches } from "react-router";
import { Suspense } from "react";

import {BreadcrumbTrail, type BreadcrumbTrailItem} from "@workspace/ui/components/custom/breadcrumb-trail"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/shadcn/sidebar";
export default function Page() {
  const matches = useMatches();

  const items = matches.flatMap<BreadcrumbTrailItem>((match) => {
    const handle = match.handle;
    // handle 默认是 unknown，需要先判断为非 null 对象后才能继续读取属性。
    if (typeof handle !== "object" || handle === null || !("nav" in handle)) {
      return [];
    }

    const nav = handle.nav;

    // nav 未配置时不生成面包屑。
    if (typeof nav !== "object" || nav === null || !("title" in nav) || typeof nav.title !== "string") {
      return [];
    }

    return [{ label: nav.title }];
  });

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-svh overflow-hidden">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-accent/40 px-6 backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <BreadcrumbTrail items={items} renderLink={(item) => (item.href ? <Link to={item.href}>{item.label}</Link> : <span>{item.label}</span>)} />
          <NavUser className="ml-auto" />
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
          <Suspense fallback={"loading........."}>
            <Outlet />
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
