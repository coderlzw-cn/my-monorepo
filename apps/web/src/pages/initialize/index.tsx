import { zodResolver } from "@hookform/resolvers/zod";
import { RiLoader3Line, RiLockPasswordLine, RiMailLine, RiSettings3Line, RiUserLine } from "@remixicon/react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import * as z from "zod";

import { queryClient } from "@/services/queryClient";
import { getAuthGetInitializationStatusQueryKey, useAuthGetInitializationStatus, useAuthInitialize } from "@/services/generated";
import { Button } from "@workspace/ui/components/shadcn/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/shadcn/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/shadcn/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@workspace/ui/components/shadcn/input-group";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth.store";

const formSchema = z
  .object({
    username: z.string().min(3, "用户名至少 3 个字符").max(64, "用户名最多 64 个字符"),
    email: z.email("请输入有效的邮箱地址").or(z.literal("")),
    password: z.string().min(8, "密码至少 8 位").max(72, "密码最多 72 位"),
    confirmPassword: z.string().min(1, "请再次输入密码"),
  })
  .refine((data) => data.password === data.confirmPassword, { message: "两次输入的密码不一致", path: ["confirmPassword"] });

type FormValues = z.infer<typeof formSchema>;

export default function Initialize() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((state) => state.setTokens);
  const initializationStatus = useAuthGetInitializationStatus({ query: { retry: false } });

  // 系统已初始化时，禁止继续打开初始化页面。
  useEffect(() => {
    if (initializationStatus.data) {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [initializationStatus.data, navigate]);

  const { mutate: initialize, isPending } = useAuthInitialize({
    mutation: {
      onSuccess: (data) => {
        // 初始化完成：更新缓存标记，避免守卫再次跳回初始化页
        queryClient.setQueryData(getAuthGetInitializationStatusQueryKey(), true);
        setTokens(data);
        toast.success("系统初始化完成");
        navigate(ROUTES.HOME, { replace: true });
      },
    },
  });

  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { username: "", email: "", password: "", confirmPassword: "" } });

  function onSubmit(data: FormValues) {
    initialize({ data: { username: data.username, password: data.password, email: data.email || undefined } });
  }

  if (initializationStatus.data) return null;

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <RiSettings3Line className="size-6" />
          </div>
          <CardTitle>系统初始化</CardTitle>
          <CardDescription>首次使用，请创建管理员账户完成初始化</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="initialize-form" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="init-username">管理员用户名</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <RiUserLine />
                      </InputGroupAddon>
                      <InputGroupInput {...field} id="init-username" type="text" placeholder="请输入用户名" autoComplete="username" aria-invalid={fieldState.invalid} />
                    </InputGroup>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="init-email">邮箱（可选）</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <RiMailLine />
                      </InputGroupAddon>
                      <InputGroupInput {...field} id="init-email" type="email" placeholder="name@example.com" autoComplete="email" aria-invalid={fieldState.invalid} />
                    </InputGroup>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="init-password">密码</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <RiLockPasswordLine />
                      </InputGroupAddon>
                      <InputGroupInput {...field} id="init-password" type="password" placeholder="至少 8 位" autoComplete="new-password" aria-invalid={fieldState.invalid} />
                    </InputGroup>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="init-confirm-password">确认密码</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <RiLockPasswordLine />
                      </InputGroupAddon>
                      <InputGroupInput {...field} id="init-confirm-password" type="password" placeholder="请再次输入密码" autoComplete="new-password" aria-invalid={fieldState.invalid} />
                    </InputGroup>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Button type="submit" form="initialize-form" className="w-full" disabled={isPending}>
            {isPending && <RiLoader3Line className="animate-spin" />}
            完成初始化
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
