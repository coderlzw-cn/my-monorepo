import { ROUTES } from "@/constants/routes";
import { useSessionLogout } from "@/services/generated/session/session";
import { RiArrowLeftLine, RiLoader4Line, RiLogoutBoxLine } from "@remixicon/react";
import { useNavigate } from "react-router";
import { ChangePasswordCard } from "./ChangePasswordCard";
import { ProfileDetailsCard } from "./ProfileDetailsCard";
import { SessionsCard } from "./SessionsCard";
import { useAuthStore } from "@/stores/auth.store";
import   { Avatar, AvatarFallback } from "@workspace/ui/components/shadcn/avatar";
import   { Button } from "@workspace/ui/components/shadcn/button";
import   { Card, CardContent } from "@workspace/ui/components/shadcn/card";

export default function ProfilePage() {
  const navigate = useNavigate();
  const clearTokens = useAuthStore((state) => state.clearTokens);
  const logout = useSessionLogout({
    mutation: {
      onSuccess: () => {
        clearTokens();
      },
    },
  });

  const profile = useAuthStore((state) => state.profile);
  const displayName = profile?.username ?? "";
  const initial = displayName.slice(0, 1);

  return (
    <div className="min-h-svh bg-muted/40">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Button
            aria-label="返回"
            className="-ml-2"
            onClick={() => {
              return window.history.state?.idx > 0 ? navigate(-1) : navigate(ROUTES.HOME);
            }}
            type="button"
            variant="ghost"
          >
            <RiArrowLeftLine />
            返回
          </Button>
          <Button disabled={logout.isPending} onClick={() => logout.mutate()} type="button" variant="ghost">
            {logout.isPending ? <RiLoader4Line aria-hidden="true" className="animate-spin" /> : <RiLogoutBoxLine aria-hidden="true" />}
            退出
          </Button>
        </div>
      </header>
      <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {profile ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-5 sm:flex-row">
              <Avatar className="size-20 border-4 border-card">
                <AvatarFallback className="bg-primary text-2xl font-semibold text-primary-foreground">{initial}</AvatarFallback>
              </Avatar>
              <div className="w-full">
                <h2 className="truncate text-xl font-semibold">{displayName}</h2>
                <p className="mt-1 truncate text-sm text-muted-foreground">{profile.email ?? "未绑定邮箱"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{profile.systemRole.label}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
          <ProfileDetailsCard />
          <ChangePasswordCard />
        </div>

        <SessionsCard />
      </section>
    </div>
  );
}
