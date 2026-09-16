import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@workspace/ui/components/shadcn/collapsible";
import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@workspace/ui/components/shadcn/sidebar";
import { RiArrowRightSLine, type RemixiconComponentType } from "@remixicon/react";
import { Link, useLocation } from "react-router";

export type SidebarNavItem = {
  title: string;
  url: string;
  icon?: RemixiconComponentType;
  items?: Array<{ title: string; url: string }>;
};

/**
 * 判断指定导航路径是否处于激活状态。
 *
 * 匹配规则：
 * - 根路径 `/`：仅当 pathname 为 `/` 时激活；
 * - 其他路径：当前路径与导航路径完全一致，或当前路径属于该导航路径的子路径时激活。
 *
 * @example
 * isNavActive('/', '/'); // true
 * isNavActive('/users', '/users'); // true
 * isNavActive('/users/123', '/users'); // true
 * isNavActive('/users/123/edit', '/users'); // true
 * isNavActive('/users-profile', '/users'); // false
 * isNavActive('/user', '/users'); // false
 */
const isNavActive = (pathname: string, url: string) => {
  return url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(`${url}/`);
};

export function NavMain({ items }: { items: SidebarNavItem[] }) {
  const { pathname } = useLocation();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const Icon = item.icon;
          const childItems = item.items ?? [];
          const isGroupActive = childItems.some((subItem) => isNavActive(pathname, subItem.url));

          if (childItems.length > 0) {
            return (
              <Collapsible className="group/collapsible" defaultOpen={isGroupActive} key={item.title}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={isGroupActive} tooltip={item.title} className="truncate">
                      {Icon ? <Icon aria-hidden="true" /> : null}
                      <span>{item.title}</span>
                      <RiArrowRightSLine aria-hidden="true" className="ml-auto transition-transform duration-200 group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {childItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title} className="truncate">
                          <SidebarMenuSubButton asChild isActive={isNavActive(pathname, subItem.url)}>
                            <Link to={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} isActive={isNavActive(pathname, item.url)} className="truncate">
                <Link to={item.url}>
                  {Icon ? <Icon aria-hidden="true" /> : null}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
