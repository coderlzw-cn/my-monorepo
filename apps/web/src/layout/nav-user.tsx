import { ROUTES } from "@/constants/routes";
import { useSessionLogout } from "@/services/generated/session/session";
import { useAuthStore } from "@/stores/auth.store";
import { Avatar, AvatarFallback } from "@workspace/ui/components/shadcn/avatar";
import { Badge } from "@workspace/ui/components/shadcn/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@workspace/ui/components/shadcn/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@workspace/ui/components/shadcn/sidebar";
import { cn } from "@workspace/ui/lib/utils";
import { RiAccountCircleLine, RiArrowUpDownLine, RiLoader4Line, RiLogoutBoxLine } from "@remixicon/react";
import { useNavigate } from "react-router";

export function NavUser({ className }: { className?: string }) {
  const navigate = useNavigate();
  const clearTokens = useAuthStore((state) => state.clearTokens);
  const profile = useAuthStore((state) => state.profile);
  const isReadOnly = useAuthStore((state) => state.isReadOnly);

  const logoutMutation = useSessionLogout({
    mutation: {
      onSettled: () => {
        clearTokens();
      },
    },
  });

  const username = profile?.username ?? "账号";
  const email = profile?.email ?? "未绑定邮箱";
  const initial = username.slice(0, 1);

  return (
    <SidebarMenu className={cn("w-fit", className)}>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground data-[state=open]:hover:bg-muted data-[state=open]:hover:text-foreground"
              size="lg"
            >
              <Avatar>
                <AvatarFallback>{initial}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm/tight">
                <div className="flex min-w-0 items-center gap-1">
                  <span className="truncate text-sm font-medium">{username}</span>
                  {isReadOnly && (
                    <Badge variant="secondary" className="h-5 bg-amber-300 px-1.5 text-xs leading-none">
                      游客
                    </Badge>
                  )}
                </div>
                <span className="truncate text-xs">{email}</span>
              </div>
              <RiArrowUpDownLine className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" side="bottom" sideOffset={4}>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE)}>
                <RiAccountCircleLine />
                个人中心
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={logoutMutation.isPending} onClick={() => logoutMutation.mutate()}>
              {logoutMutation.isPending ? <RiLoader4Line aria-hidden="true" className="animate-spin" /> : <RiLogoutBoxLine aria-hidden="true" />}
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
