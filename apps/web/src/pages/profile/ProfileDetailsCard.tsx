import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { RiLoader4Line } from "@remixicon/react";
import { Button } from "@workspace/ui/components/shadcn/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/shadcn/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/shadcn/field";
import { Input } from "@workspace/ui/components/shadcn/input";

import { getProfileGetProfileQueryKey, useProfileUpdateProfile } from "@/services/generated";
import { useAuthStore } from "@/stores/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { formatDateTime } from "@workspace/utils/shared/date";

const profileSchema = z.object({
  username: z.string().trim().min(1, "请输入用户名").min(3, "用户名至少 3 个字符").max(64, "用户名最多 64 个字符"),
  email: z
    .string()
    .trim()
    .refine((value) => value === "" || z.email().safeParse(value).success, { message: "请输入有效邮箱" }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileDetailsCard() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const profile = useAuthStore((state) => state.profile);
  const updateProfile = useProfileUpdateProfile({
    mutation: {
      onSuccess: (updatedProfile) => {
        const queryKey = getProfileGetProfileQueryKey();
        // 当前页面读取 Zustand；同步更新 Query 缓存，保证路由守卫的资料缓存也保持最新。
        queryClient.setQueryData(queryKey, updatedProfile);
        useAuthStore.getState().setProfile(updatedProfile);
        toast.success("更新成功");
        setIsEditing(false);
      },
    },
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      username: profile?.username ?? "",
      email: profile?.email ?? "",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>基本资料</CardTitle>
        <CardDescription>默认只读，编辑后可修改用户名和邮箱。</CardDescription>
      </CardHeader>

      <CardContent>
        <form id="profile-form" noValidate onSubmit={form.handleSubmit((values) => updateProfile.mutate({ data: values }))}>
          <FieldGroup>
            <div className="grid gap-6 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="username"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>用户名</FieldLabel>

                    <Input {...field} id={field.name} autoComplete="username" aria-invalid={fieldState.invalid} disabled={!isEditing} placeholder="请输入 3～64 个字符" />

                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>邮箱</FieldLabel>

                    <Input {...field} id={field.name} type="email" autoComplete="email" aria-invalid={fieldState.invalid} disabled={!isEditing} placeholder="请输入邮箱，可留空" />

                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Field>
                <FieldLabel htmlFor="profile-role">角色</FieldLabel>

                <Input id="profile-role" disabled readOnly value={profile?.systemRole.label ?? ""} />
              </Field>

              <Field>
                <FieldLabel htmlFor="profile-id">账号 ID</FieldLabel>
                <Input id="profile-id" disabled readOnly value={String(profile?.id ?? "")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="profile-created-time">创建时间</FieldLabel>
                <Input id="profile-created-time" disabled readOnly value={formatDateTime(profile?.createdTime ?? "")} />
              </Field>

              <Field>
                <FieldLabel htmlFor="profile-updated-time">更新时间</FieldLabel>

                <Input id="profile-updated-time" disabled readOnly value={formatDateTime(profile?.updatedTime ?? "")} />
              </Field>
            </div>
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter>
        {isEditing ? (
          <Button key="update" className="w-full" form="profile-form" type="submit">
            {updateProfile.isPending && <RiLoader4Line aria-hidden="true" className="animate-spin" />}
            更新
          </Button>
        ) : (
          <Button key="edit" className="w-full" type="button" variant="outline" onClick={() => setIsEditing(true)}>
            编辑
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
