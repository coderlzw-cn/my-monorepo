import { zodResolver } from "@hookform/resolvers/zod";
import { RiLoader4Line } from "@remixicon/react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@workspace/ui/components/shadcn/button";
import { Checkbox } from "@workspace/ui/components/shadcn/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/shadcn/dialog";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/shadcn/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/shadcn/select";
import { Switch } from "@workspace/ui/components/shadcn/switch";
import { SYSTEM_ROLES } from "@workspace/common/constants/enum.constants";
import { useBusinessRoleFindAll } from "@/services/generated/business-roles/business-roles";
import type { UserVo } from "@/services/generated/models";
import { useSystemRolesFindAll } from "@/services/generated/system-roles/system-roles";

const editUserSchema = z.object({
  systemRoleId: z.uuid("请选择有效的系统角色"),

  disabled: z.boolean(),

  roleIds: z.array(z.uuid("业务角色格式不正确")),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

type UserEditFormProps = {
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: EditUserFormValues) => void;
  open: boolean;
  user: UserVo | null;
};

export function UserEditFormDialog({ isPending, onOpenChange, onSubmit, open, user }: UserEditFormProps) {
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      systemRoleId: "",
      disabled: false,
      roleIds: [],
    },
  });

  const { data: systemRoles } = useSystemRolesFindAll({
    page: 1,
    pageSize: 100,
  });

  const { data: businessRoles } = useBusinessRoleFindAll({
    page: 1,
    pageSize: 100,
  });

  useEffect(() => {
    if (!open || !user) return;

    form.reset({
      systemRoleId: user.systemRole.id,
      disabled: user.disabled,
      roleIds: user.businessRoles.map((item) => item.id),
    });
  }, [form, open, user]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="md:max-w-3xl">
        <DialogHeader>
          <DialogTitle>编辑用户</DialogTitle>

          <DialogDescription>{user ? `修改 ${user.username} 的系统角色、登录状态和业务角色。` : "修改用户的系统权限和登录状态。"}</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" id="user-edit-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="systemRoleId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>系统角色</FieldLabel>

                  <Select disabled={user?.systemRole.key === SYSTEM_ROLES.SUPER_ADMIN.key} value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                      <SelectValue placeholder="请选择系统角色" />
                    </SelectTrigger>

                    <SelectContent>
                      {(systemRoles?.list ?? [])
                        .filter((item) => item.key !== SYSTEM_ROLES.SUPER_ADMIN.key || item.id === user?.systemRole.id)
                        .map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <FieldDescription>{user?.systemRole.key === SYSTEM_ROLES.SUPER_ADMIN.key ? "超级管理员的系统角色不可修改" : "请选择用于控制该用户系统级权限的角色"}</FieldDescription>

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="disabled"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor={field.name}>禁止登录</FieldLabel>

                    <FieldDescription>{user?.systemRole.key === SYSTEM_ROLES.SUPER_ADMIN.key ? "超级管理员不可禁止登录" : "开启后，该用户将无法登录系统"}</FieldDescription>

                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </FieldContent>

                  <Switch id={field.name} aria-invalid={fieldState.invalid} checked={field.value} disabled={user?.systemRole.key === SYSTEM_ROLES.SUPER_ADMIN.key} onCheckedChange={field.onChange} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="roleIds"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>业务角色</FieldLabel>

                  <FieldDescription>请选择该用户所属的业务角色，可同时选择多个</FieldDescription>

                  <div className="grid max-h-40 grid-cols-3 gap-2 overflow-y-auto rounded-md border p-2">
                    {(businessRoles?.list ?? []).length === 0 ? (
                      <p className="col-span-3 py-4 text-center text-sm text-muted-foreground">暂无可分配的业务角色</p>
                    ) : (
                      (businessRoles?.list ?? []).map((item) => {
                        const checked = field.value.includes(item.id);

                        return (
                          <label key={item.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => {
                                if (value === true) {
                                  field.onChange([...field.value, item.id]);

                                  return;
                                }

                                field.onChange(field.value.filter((id) => id !== item.id));
                              }}
                            />

                            <span className="truncate">{item.label}</span>
                          </label>
                        );
                      })
                    )}
                  </div>

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

          <Button disabled={isPending} form="user-edit-form" type="submit">
            {isPending ? <RiLoader4Line className="size-4 animate-spin" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
