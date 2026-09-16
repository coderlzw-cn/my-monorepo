import { Button } from "@workspace/ui/components/shadcn/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/shadcn/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/shadcn/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@workspace/ui/components/shadcn/input-group";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { RiLoader3Line, RiLockPasswordLine, RiMailLine, RiUserAddLine, RiUserLine } from "@remixicon/react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import * as z from "zod";
import { useAuthRegister } from "@/services/generated";

const formSchema = z
  .object({
    username: z.string().min(3, "用户名至少 3 个字符").max(64, "用户名最多 64 个字符"),
    email: z.email("请输入有效的邮箱地址").or(z.literal("")),
    password: z.string().min(8, "密码至少 8 位").max(72, "密码最多 72 位"),
    confirmPassword: z.string().min(1, "请再次输入密码"),
  })
  .refine((data) => data.password === data.confirmPassword, { message: "两次输入的密码不一致", path: ["confirmPassword"] });

type FormValues = z.infer<typeof formSchema>;

export default function Register() {
  const setTokens = useAuthStore((state) => state.setTokens);
  const navigate = useNavigate();
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { username: "", email: "", password: "", confirmPassword: "" } });

  const registerMutation = useAuthRegister();

  function onSubmit(data: FormValues) {
    registerMutation.mutate(
      { data },
      {
        onSuccess: ({ accessToken, refreshToken }) => {
          setTokens({ accessToken, refreshToken });
          navigate(ROUTES.HOME, { replace: true });
        },
      },
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <RiUserAddLine className="size-6" />
          </div>
          <CardTitle>注册</CardTitle>
          <CardDescription>创建一个新账户</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="register-form" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-username">用户名</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <RiUserLine />
                      </InputGroupAddon>
                      <InputGroupInput {...field} id="register-username" type="text" placeholder="请输入用户名" autoComplete="username" aria-invalid={fieldState.invalid} />
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
                    <FieldLabel htmlFor="register-email">邮箱（可选）</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <RiMailLine />
                      </InputGroupAddon>
                      <InputGroupInput {...field} id="register-email" type="email" placeholder="name@example.com" autoComplete="email" aria-invalid={fieldState.invalid} />
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
                    <FieldLabel htmlFor="register-password">密码</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <RiLockPasswordLine />
                      </InputGroupAddon>
                      <InputGroupInput {...field} id="register-password" type="password" placeholder="至少 8 位" autoComplete="new-password" aria-invalid={fieldState.invalid} />
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
                    <FieldLabel htmlFor="register-confirm-password">确认密码</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <RiLockPasswordLine />
                      </InputGroupAddon>
                      <InputGroupInput {...field} id="register-confirm-password" type="password" placeholder="请再次输入密码" autoComplete="new-password" aria-invalid={fieldState.invalid} />
                    </InputGroup>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button type="submit" form="register-form" className="w-full" disabled={registerMutation.isPending}>
            {registerMutation.isPending && <RiLoader3Line className="animate-spin" />}
            注册
          </Button>
          <p className="text-sm text-muted-foreground">
            已有账户？{" "}
            <Link to={ROUTES.LOGIN} className="underline underline-offset-4">
              去登录
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
