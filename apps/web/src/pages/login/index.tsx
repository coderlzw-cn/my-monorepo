import { zodResolver } from "@hookform/resolvers/zod";
import { RiLoader3Line, RiLockPasswordLine, RiShieldUserLine, RiUserLine } from "@remixicon/react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router";
import * as z from "zod";

import { ROUTES } from "@/constants/routes";
import { useAuthLogin } from "@/services/generated";
import { useAuthStore } from "@/stores/auth.store";

import { Button } from "@workspace/ui/components/shadcn/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/shadcn/card";
import { Checkbox } from "@workspace/ui/components/shadcn/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/shadcn/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@workspace/ui/components/shadcn/input-group";

const formSchema = z.object({
  username: z.string().trim().min(1, "请输入用户名").min(3, "用户名不能少于 3 个字符").max(20, "用户名不能超过 20 个字符"),

  password: z.string().min(1, "请输入密码").min(6, "密码不能少于 6 个字符").max(32, "密码不能超过 32 个字符"),

  remember: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const setTokens = useAuthStore((state) => state.setTokens);
  const setRememberMe = useAuthStore((state) => state.setRememberMe);

  const { mutate: loginMutation, isPending } = useAuthLogin({
    mutation: {
      onSuccess: (data) => {
        setTokens(data);

        const from = searchParams.get("from");
        const target = from?.startsWith("/") ? from : ROUTES.HOME;

        navigate(target, { replace: true });
      },
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: import.meta.env.DEV ? "admin" : "",
      password: import.meta.env.DEV ? "123456" : "",
      remember: false,
    },
  });

  function onSubmit({ remember, username, password }: FormValues) {
    // 登录成功后根据该标记决定 Token 的持久化位置。
    setRememberMe(remember);
    loginMutation({
      data: {
        username,
        password,
      },
    });
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <RiShieldUserLine className="size-6" />
          </div>

          <CardTitle>登录</CardTitle>

          <CardDescription>输入用户名和密码登录你的账户</CardDescription>
        </CardHeader>

        <CardContent>
          <form id="login-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-username">用户名</FieldLabel>

                    <InputGroup>
                      <InputGroupAddon>
                        <RiUserLine />
                      </InputGroupAddon>

                      <InputGroupInput {...field} id="login-username" type="text" placeholder="请输入用户名" autoComplete="username" aria-invalid={fieldState.invalid} />
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
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="login-password">密码</FieldLabel>

                      <a href="#" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                        忘记密码？
                      </a>
                    </div>

                    <InputGroup>
                      <InputGroupAddon>
                        <RiLockPasswordLine />
                      </InputGroupAddon>

                      <InputGroupInput {...field} id="login-password" type="password" placeholder="请输入密码" autoComplete="current-password" aria-invalid={fieldState.invalid} />
                    </InputGroup>

                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="remember"
                control={form.control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Checkbox id="login-remember" name={field.name} checked={field.value} onCheckedChange={field.onChange} />

                    <FieldLabel htmlFor="login-remember" className="font-normal">
                      记住我
                    </FieldLabel>
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-3">
          <Button type="submit" form="login-form" className="w-full" disabled={isPending}>
            {isPending && <RiLoader3Line className="animate-spin" />}
            登录
          </Button>

          <p className="text-sm text-muted-foreground">
            还没有账户？{" "}
            <Link to={ROUTES.REGISTER} className="underline underline-offset-4">
              注册
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
