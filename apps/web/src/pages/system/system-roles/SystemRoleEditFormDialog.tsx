import { zodResolver } from "@hookform/resolvers/zod";
import { RiLoader4Line } from "@remixicon/react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@workspace/ui/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/shadcn/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/shadcn/field";
import { Input } from "@workspace/ui/components/shadcn/input";
import { Textarea } from "@workspace/ui/components/shadcn/textarea";

import type { CreateSystemRoleDto, SystemRoleVo } from "@/services/generated/models";

const systemRoleFormSchema = z.object({
  description: z.string().max(1024, "说明最多 1024 个字符"),
  key: z
    .string()
    .trim()
    .min(1, "请输入角色标识")
    .max(64, "标识最多 64 个字符")
    .regex(/^[A-Z][A-Z0-9_]*$/, "标识需以大写字母开头，只能包含大写字母、数字和下划线"),
  label: z.string().trim().min(1, "请输入角色名称"),
});

type SystemRoleFormValues = z.infer<typeof systemRoleFormSchema>;

type SystemRoleEditFormProps = {
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateSystemRoleDto) => void;
  open: boolean;
  role: SystemRoleVo | null;
};

export function SystemRoleEditFormDialog({ isPending, onOpenChange, onSubmit, open, role }: SystemRoleEditFormProps) {
  const isEditing = role !== null;

  const form = useForm<SystemRoleFormValues>({
    resolver: zodResolver(systemRoleFormSchema),
    defaultValues: {
      description: "",
      key: "",
      label: "",
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      description: role?.description ?? "",
      key: role?.key ?? "",
      label: role?.label ?? "",
    });
  }, [form, open, role]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "编辑系统角色" : "新建系统角色"}</DialogTitle>

          <DialogDescription>{isEditing ? `修改 ${role.label} 的自定义系统角色信息。` : "创建自定义系统角色。SUPER_ADMIN、ADMIN、GUEST、USER 为内置角色，不可新建或修改。"}</DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          id="system-role-form"
          noValidate
          onSubmit={form.handleSubmit((values) => {
            onSubmit({
              description: values.description.trim(),
              key: values.key,
              label: values.label,
            });
          })}
        >
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="key"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>标识</FieldLabel>

                  <Input id={field.name} aria-invalid={fieldState.invalid} placeholder="请输入角色标识" {...field} />

                  <FieldDescription>以大写字母开头，仅支持大写字母、数字和下划线</FieldDescription>

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="label"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>名称</FieldLabel>

                  <Input id={field.name} aria-invalid={fieldState.invalid} placeholder="请输入角色名称" {...field} />

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>说明</FieldLabel>

                  <Textarea id={field.name} aria-invalid={fieldState.invalid} placeholder="请输入角色说明（可选）" {...field} />

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button disabled={isPending} type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>

          <Button disabled={isPending} form="system-role-form" type="submit">
            {isPending ? <RiLoader4Line className="size-4 animate-spin" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
