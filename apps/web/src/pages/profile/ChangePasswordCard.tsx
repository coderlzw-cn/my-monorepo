import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { RiEyeLine, RiEyeOffLine, RiLoader4Line } from "@remixicon/react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@workspace/ui/components/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/shadcn/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/shadcn/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@workspace/ui/components/shadcn/input-group";

import { getSessionFindAllQueryKey } from "@/services/generated/session/session";
import { useProfileUpdatePassword } from "@/services/generated/profile/profile";

const passwordSchema = z.string().min(1, "请输入密码").min(6, "密码至少 6 个字符").max(64, "密码最多 64 个字符");

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "请输入当前密码"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "请再次输入新密码"),
  })
  .refine((values) => values.currentPassword !== values.newPassword, {
    message: "新密码不能与当前密码相同",
    path: ["newPassword"],
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "两次输入的新密码不一致",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

type PasswordField = "current" | "new" | "confirm";

export function ChangePasswordCard() {
  const queryClient = useQueryClient();

  const [visibleField, setVisibleField] = useState<PasswordField | null>(null);

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updatePasswordMutation = useProfileUpdatePassword({
    mutation: {
      onSuccess: () => {
        form.reset();
        setVisibleField(null);
        toast.success("更新成功");
        void queryClient.invalidateQueries({ queryKey: getSessionFindAllQueryKey() });
      },
    },
  });

  const togglePasswordVisibility = (field: PasswordField) => setVisibleField((current) => (current === field ? null : field));

  return (
    <Card>
      <CardHeader>
        <CardTitle>修改密码</CardTitle>
        <CardDescription>更新密码后将注销其他登录会话，当前会话保持有效。</CardDescription>
      </CardHeader>

      <CardContent>
        <form
          noValidate
          onSubmit={form.handleSubmit((values) => {
            updatePasswordMutation.mutate({
              data: {
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
              },
            });
          })}
        >
          <FieldGroup className="grid gap-6">
            <Controller
              control={form.control}
              name="currentPassword"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>当前密码</FieldLabel>

                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id={field.name}
                      type={visibleField === "current" ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="输入当前登录密码"
                      aria-invalid={fieldState.invalid}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton type="button" size="icon-xs" aria-label={visibleField === "current" ? "隐藏当前密码" : "显示当前密码"} onClick={() => togglePasswordVisibility("current")}>
                        {visibleField === "current" ? <RiEyeOffLine /> : <RiEyeLine />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="newPassword"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>新密码</FieldLabel>

                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id={field.name}
                      type={visibleField === "new" ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="请输入 6～64 个字符的新密码"
                      aria-invalid={fieldState.invalid}
                    />

                    <InputGroupAddon align="inline-end">
                      <InputGroupButton type="button" size="icon-xs" aria-label={visibleField === "new" ? "隐藏新密码" : "显示新密码"} onClick={() => togglePasswordVisibility("new")}>
                        {visibleField === "new" ? <RiEyeOffLine /> : <RiEyeLine />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>确认新密码</FieldLabel>

                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id={field.name}
                      type={visibleField === "confirm" ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="再次输入新密码"
                      aria-invalid={fieldState.invalid}
                    />

                    <InputGroupAddon align="inline-end">
                      <InputGroupButton type="button" size="icon-xs" aria-label={visibleField === "confirm" ? "隐藏确认密码" : "显示确认密码"} onClick={() => togglePasswordVisibility("confirm")}>
                        {visibleField === "confirm" ? <RiEyeOffLine /> : <RiEyeLine />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Field>
              <Button className="w-full sm:w-auto" disabled={updatePasswordMutation.isPending} type="submit">
                {updatePasswordMutation.isPending && <RiLoader4Line aria-hidden="true" className="animate-spin" />}
                更新
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
