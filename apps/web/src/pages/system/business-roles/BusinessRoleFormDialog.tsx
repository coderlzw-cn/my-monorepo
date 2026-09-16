import { zodResolver } from "@hookform/resolvers/zod";
import { RiLoader4Line } from "@remixicon/react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@workspace/ui/components/shadcn/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/shadcn/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/shadcn/field";
import { Input } from "@workspace/ui/components/shadcn/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/shadcn/select";
import { Textarea } from "@workspace/ui/components/shadcn/textarea";

import { useBusinessRoleFindAll } from "@/services/generated/business-roles/business-roles";
import type { BusinessRoleVo, CreateBusinessRoleDto } from "@/services/generated/models";

const NONE_PARENT = "__none__";

const roleFormSchema = z.object({
  description: z.string().max(1024, "角色说明不能超过 1024 个字符"),

  key: z
    .string()
    .trim()
    .min(1, "请输入角色标识")
    .max(64, "角色标识不能超过 64 个字符")
    .regex(/^[a-z][a-z0-9_]*$/, "角色标识必须以小写字母开头，且只能包含小写字母、数字和下划线"),

  label: z.string().trim().min(1, "请输入角色名称").max(64, "角色名称不能超过 64 个字符"),

  level: z
    .number({
      error: "请输入权限级别",
    })
    .int("权限级别必须为整数")
    .min(0, "权限级别不能小于 0"),

  parentId: z.string(),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;

type RoleFormDialogProps = {
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateBusinessRoleDto) => void;
  open: boolean;
  role: BusinessRoleVo | null;
};

export function BusinessRoleFormDialog({ isPending, onOpenChange, onSubmit, open, role }: RoleFormDialogProps) {
  const isEditing = role !== null;

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      description: "",
      key: "",
      label: "",
      level: 0,
      parentId: NONE_PARENT,
    },
  });

  const rolesQuery = useBusinessRoleFindAll(
    {
      page: 1,
      pageSize: 100,
    },
    {
      query: {
        enabled: open,
      },
    },
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      description: role?.description ?? "",
      key: role?.key ?? "",
      label: role?.label ?? "",
      level: role?.level ?? 0,
      parentId: role?.parentId ?? NONE_PARENT,
    });
  }, [form, open, role]);

  const parentOptions = (rolesQuery.data?.list ?? []).filter((item) => item.id !== role?.id);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "编辑业务角色" : "新建业务角色"}</DialogTitle>

          <DialogDescription>{isEditing ? `修改 ${role.label} 的业务角色信息。` : "创建新的业务角色，并配置角色标识、权限级别和所属父角色。"}</DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          id="role-form"
          noValidate
          onSubmit={form.handleSubmit((values) => {
            onSubmit({
              description: values.description.trim(),
              key: values.key,
              label: values.label,
              level: values.level,
              parentId: values.parentId === NONE_PARENT ? undefined : values.parentId,
            });
          })}
        >
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="key"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>角色标识</FieldLabel>

                  <Input id={field.name} aria-invalid={fieldState.invalid} placeholder="请输入角色标识" {...field} />

                  <FieldDescription>以小写字母开头，仅支持小写字母、数字和下划线</FieldDescription>

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="label"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>角色名称</FieldLabel>

                  <Input id={field.name} aria-invalid={fieldState.invalid} placeholder="请输入角色名称" {...field} />

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="level"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>权限级别</FieldLabel>

                  <Input
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    inputMode="numeric"
                    min={0}
                    placeholder="请输入权限级别"
                    type="number"
                    {...field}
                    onChange={(event) => {
                      const value = event.currentTarget.value;

                      if (value === "") {
                        field.onChange(0);
                        return;
                      }

                      const next = event.currentTarget.valueAsNumber;

                      field.onChange(Number.isNaN(next) ? 0 : next);
                    }}
                  />

                  <FieldDescription>使用非负整数表示角色的权限级别</FieldDescription>

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="parentId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>父角色</FieldLabel>

                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                      <SelectValue placeholder="请选择父角色" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value={NONE_PARENT}>无父角色（顶级角色）</SelectItem>

                      {parentOptions.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FieldDescription>不选择父角色时，该角色将作为顶级角色</FieldDescription>

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>角色说明</FieldLabel>

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

          <Button disabled={isPending} form="role-form" type="submit">
            {isPending ? <RiLoader4Line className="size-4 animate-spin" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
