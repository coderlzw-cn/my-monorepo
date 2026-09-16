import { getSessionFindAllQueryKey, useSessionFindAll, useSessionRemove } from "@/services/generated/session/session";
import { RiLoader4Line, RiComputerLine, RiSmartphoneLine } from "@remixicon/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/shadcn/alert-dialog";
import { Badge } from "@workspace/ui/components/shadcn/badge";
import { Button } from "@workspace/ui/components/shadcn/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/shadcn/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@workspace/ui/components/shadcn/item";
import { Skeleton } from "@workspace/ui/components/shadcn/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import { useState } from "react";

const CONFIRM_ALL = "all";

/** 从 UA 中解析出「浏览器 · 系统」的可读描述 */
function parseUserAgent(ua: string) {
  const browser = ua.includes("Edg/")
    ? "Edge"
    : ua.includes("Chrome/")
      ? "Chrome"
      : ua.includes("Firefox/")
        ? "Firefox"
        : ua.includes("Safari/")
          ? "Safari"
          : ua.includes("curl/")
            ? "curl"
            : "未知浏览器";

  const os = ua.includes("iPhone") ? "iOS" : ua.includes("Android") ? "Android" : ua.includes("Mac OS X") ? "macOS" : ua.includes("Windows") ? "Windows" : ua.includes("Linux") ? "Linux" : "未知系统";

  const mobile = ua.includes("iPhone") || ua.includes("Android");
  return { label: `${browser} · ${os}`, mobile };
}

export function SessionsCard() {
  const queryClient = useQueryClient();
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);

  const sessionsQuery = useSessionFindAll();
  const sessions = sessionsQuery.data;
  const otherSessions = sessions?.filter((session) => !session.current) ?? [];

  const removeSessionMutation = useSessionRemove({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getSessionFindAllQueryKey() });
      },
    },
  });

  const removeOtherSessionsMutation = useSessionRemove({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getSessionFindAllQueryKey() });
      },
    },
  });

  const removingSessionId = removeSessionMutation.variables?.sessionId;
  const isRemovingAll = removeOtherSessionsMutation.isPending;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>登录设备</CardTitle>
          <CardDescription>最近登录的设备与会话，可将其他设备下线。</CardDescription>
          {otherSessions.length > 0 ? (
            <CardAction>
              <Button aria-busy={isRemovingAll} disabled={isRemovingAll} onClick={() => setConfirmTarget(CONFIRM_ALL)} size="sm" type="button" variant="outline">
                {isRemovingAll ? <RiLoader4Line aria-hidden="true" className="animate-spin" /> : null}
                下线其他设备（{otherSessions.length}）
              </Button>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          {sessionsQuery.isPending ? (
            <ItemGroup aria-busy="true" aria-label="登录设备加载中" className="gap-3">
              {["skeleton-1", "skeleton-2"].map((key) => (
                <Item key={key} role="listitem" className="border-neutral-100 bg-neutral-50">
                  <ItemMedia variant="icon">
                    <Skeleton className="size-4 rounded-sm" />
                  </ItemMedia>
                  <ItemContent>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48 max-w-full" />
                  </ItemContent>
                </Item>
              ))}
            </ItemGroup>
          ) : null}

          {sessions && sessions.length > 0 ? (
            <ItemGroup aria-label="登录设备" className="gap-3">
              {sessions.map((session) => {
                const device = parseUserAgent(session.userAgent ?? "");
                const isRemoving = removeSessionMutation.isPending && removingSessionId === session.id;
                const DeviceIcon = device.mobile ? RiSmartphoneLine : RiComputerLine;

                return (
                  <Item aria-current={session.current ? "true" : undefined} className={cn(session.current && `border-primary/40 bg-primary/5`)} key={session.id} role="listitem" variant="outline">
                    <ItemMedia variant="icon">
                      <DeviceIcon aria-hidden="true" />
                      <span className="sr-only">{device.mobile ? "移动设备" : "电脑"}</span>
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle>
                        <span className="truncate">{device.label}</span>
                        {session.current ? <Badge className="text-xs font-normal">当前设备</Badge> : null}
                      </ItemTitle>
                      <ItemDescription>
                        IP {session.ipAddress || "未知"} · 最近活跃 {/* {formatDateTime(session.lastUsedTime)} */}
                      </ItemDescription>
                    </ItemContent>
                    {session.current ? null : (
                      <ItemActions className="w-full sm:w-auto">
                        <Button aria-busy={isRemoving} className="w-full sm:w-auto" disabled={isRemoving} onClick={() => setConfirmTarget(session.id)} size="sm" type="button" variant="outline">
                          {isRemoving && <RiLoader4Line className="size-4 animate-spin" />} 下线
                        </Button>
                      </ItemActions>
                    )}
                  </Item>
                );
              })}
            </ItemGroup>
          ) : null}
        </CardContent>
      </Card>

      <AlertDialog open={confirmTarget !== null} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTarget === CONFIRM_ALL ? "下线所有其他设备？" : "下线该设备？"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget === CONFIRM_ALL ? `将注销 ${otherSessions.length} 个其他设备的登录会话，对应设备需要重新登录。` : "该设备的登录会话将被注销，需要重新登录才能继续使用。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (confirmTarget === CONFIRM_ALL) {
                  otherSessions.forEach((session) => removeOtherSessionsMutation.mutate({ sessionId: session.id }));
                } else if (confirmTarget) {
                  removeSessionMutation.mutate({ sessionId: confirmTarget });
                }
                setConfirmTarget(null);
              }}
            >
              确认下线
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
