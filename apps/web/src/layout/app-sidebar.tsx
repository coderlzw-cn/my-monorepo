import { useRef, useState, type PointerEvent } from "react";
import { Link } from "react-router";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";

import { ROUTES } from "@/constants/routes";
import { NavMain } from "@/layout/nav-main";
import { layoutRoutes } from "@/router";
import { buildSidebarNav } from "@/router/nav";
import { useAuthStore } from "@/stores/auth.store";

import { Button } from "@workspace/ui/components/shadcn/button";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@workspace/ui/components/shadcn/sidebar";

type SidebarResizeHandleProps = {
  width: number;
  onWidthChange: (width: number) => void;
};

/** 侧边栏默认展开宽度。 */
export const DEFAULT_SIDEBAR_WIDTH = 256;

/** 侧边栏展开状态下允许的最小宽度。 */
export const MIN_SIDEBAR_WIDTH = 50;

/** 侧边栏允许的最大宽度。 */
export const MAX_SIDEBAR_WIDTH = 400;

/** 向左拖动超过该宽度后折叠侧边栏。 */
const SIDEBAR_COLLAPSE_THRESHOLD = 50;

/** 折叠状态下向右拖动超过该距离后展开侧边栏。 */
const SIDEBAR_EXPAND_DRAG_THRESHOLD = 24;

/** 将侧边栏宽度限制在允许范围内。 */
const clampSidebarWidth = (width: number) => Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width));

/**
 * 设置侧边栏拖拽状态。
 *
 * 拖拽期间通过 data-resizing 属性禁用或调整相关过渡效果。
 */
function setSidebarResizing(handle: HTMLElement, isResizing: boolean) {
  const sidebar = handle.closest<HTMLElement>('[data-slot="sidebar"]');

  if (!sidebar) return;

  if (isResizing) {
    sidebar.dataset.resizing = "true";
  } else {
    delete sidebar.dataset.resizing;
  }
}

/**
 * 侧边栏宽度调整手柄。
 *
 * 支持：
 * - 鼠标/触摸拖拽调整宽度；
 * - 向左拖动触发折叠；
 * - 折叠后向右拖动触发展开；
 * - 双击恢复默认宽度。
 */
function SidebarResizeHandle({ width, onWidthChange }: SidebarResizeHandleProps) {
  const { setOpen, state } = useSidebar();

  // 保存一次拖拽开始时的状态，避免拖动过程中 React 更新影响基准值。
  const dragStartRef = useRef<{
    isCollapsed: boolean;
    pointerX: number;
    width: number;
  } | null>(null);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // 仅响应鼠标左键；触摸和触控笔的 button 通常同样为 0。
    if (event.button !== 0) return;

    dragStartRef.current = {
      isCollapsed: state === "collapsed",
      pointerX: event.clientX,
      width,
    };

    setSidebarResizing(event.currentTarget, true);

    // 捕获指针，确保指针移出拖拽区域后仍能持续接收事件。
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragStart = dragStartRef.current;

    if (!dragStart) return;

    // 折叠状态下需要向右拖动一定距离后才展开，避免轻微误触。
    if (dragStart.isCollapsed) {
      const dragDistance = event.clientX - dragStart.pointerX;

      if (dragDistance < SIDEBAR_EXPAND_DRAG_THRESHOLD) return;

      setOpen(true);

      onWidthChange(clampSidebarWidth(MIN_SIDEBAR_WIDTH + dragDistance - SIDEBAR_EXPAND_DRAG_THRESHOLD));

      return;
    }

    const nextWidth = dragStart.width + event.clientX - dragStart.pointerX;

    // 继续向左拖动超过阈值时直接折叠侧边栏。
    if (nextWidth <= SIDEBAR_COLLAPSE_THRESHOLD) {
      dragStartRef.current = null;

      event.currentTarget.releasePointerCapture(event.pointerId);
      setSidebarResizing(event.currentTarget, false);

      // 折叠前恢复原宽度，使下次展开时回到拖动前的尺寸。
      onWidthChange(dragStart.width);
      setOpen(false);
      return;
    }

    onWidthChange(clampSidebarWidth(nextWidth));
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;

    dragStartRef.current = null;

    event.currentTarget.releasePointerCapture(event.pointerId);
    setSidebarResizing(event.currentTarget, false);
  };

  return (
    <div
      aria-label="拖动调整侧边栏宽度"
      className="absolute inset-y-0 right-0 z-30 hidden w-3 translate-x-1/2 cursor-col-resize touch-none after:absolute after:inset-y-0 after:left-1/2 after:w-px after:bg-transparent hover:after:bg-sidebar-border md:block"
      title="拖动调整宽度，继续向左可折叠；双击恢复默认宽度"
      onDoubleClick={() => onWidthChange(DEFAULT_SIDEBAR_WIDTH)}
      onPointerCancel={handlePointerEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
    />
  );
}

/**
 * 侧边栏折叠/展开按钮。
 */
function SidebarCollapseButton() {
  const { state, toggleSidebar } = useSidebar();

  const isCollapsed = state === "collapsed";
  const label = isCollapsed ? "展开侧边栏" : "折叠侧边栏";

  return (
    <Button
      aria-label={label}
      className="absolute top-14 right-0 z-40 hidden size-7 translate-x-1/2 rounded-full border border-sidebar-border bg-sidebar p-0 text-sidebar-foreground shadow-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:inline-flex"
      size="icon"
      title={label}
      type="button"
      variant="ghost"
      onClick={toggleSidebar}
    >
      {isCollapsed ? <RiArrowRightSLine aria-hidden="true" className="size-4" /> : <RiArrowLeftSLine aria-hidden="true" className="size-4" />}
    </Button>
  );
}

/**
 * 应用主侧边栏。
 *
 * 根据当前用户的系统角色动态生成可访问的导航菜单，
 * 并支持折叠和自定义宽度。
 */
export function AppSidebar() {
  const [sidebarWidth, setSidebarWidthState] = useState(DEFAULT_SIDEBAR_WIDTH);


  const profile = useAuthStore((state) => state.profile);

  // 根据路由配置和当前用户角色生成有权限访问的导航菜单。
  const navItems = buildSidebarNav(layoutRoutes, ROUTES.HOME, profile?.systemRole.key);

  // 同步本地宽度状态和 SidebarProvider 中实际使用的宽度。
  const handleWidthChange = (width: number) => {
    setSidebarWidthState(width);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="group-data-[collapsible=icon]:justify-center" size="lg" tooltip="应用名称">
              <Link to={ROUTES.HOME}>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm ring-1 ring-sidebar-primary-foreground/10">
                  应用 Icon
                </span>
                <span className="truncate font-semibold">应用名称</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarCollapseButton />

      <SidebarResizeHandle width={sidebarWidth} onWidthChange={handleWidthChange} />
    </Sidebar>
  );
}
