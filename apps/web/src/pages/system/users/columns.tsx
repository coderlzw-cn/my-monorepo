import type { DataTableColumnDef } from "@workspace/ui/components/custom/data-table/types";
import { RiEditLine, RiDeleteBinLine } from "@remixicon/react";
import { type Dispatch, type SetStateAction } from "react";

import { formatDateTime } from "@workspace/utils/shared/date";
import { Badge } from "@workspace/ui/components/shadcn/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/shadcn/tooltip";

import { DataTableActions, type DataTableRowAction } from "@workspace/ui/components/custom/data-table/data-table-actions";
import { TruncatedCell } from "@/features/dataTable/TruncatedCell";
import type { UserVo } from "@/services/generated/models";
import { createDataTableSelectionColumn } from "@/features/dataTable/data-table-selection";
import { SYSTEM_ROLES } from "@workspace/common/constants/enum.constants";

export const UserAction = {
  edit: "edit",
  delete: "delete",
} as const;

export type UserActionType = (typeof UserAction)[keyof typeof UserAction];

export type UserColumnActions = {
  setRowAction: Dispatch<SetStateAction<DataTableRowAction<UserVo, UserActionType> | null>>;
  systemRoleOptions: { label: string; value: string }[];
};

export function getUserColumns({ setRowAction, systemRoleOptions }: UserColumnActions): DataTableColumnDef<UserVo>[] {
  return [
    createDataTableSelectionColumn({ getLabel: (user: UserVo) => user.username, canSelect: (user: UserVo) => user.systemRole.key !== SYSTEM_ROLES.SUPER_ADMIN.key }),
    {
      id: "id",
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <TruncatedCell className="max-w-40" value={row.original.id} />,
      size: 60,
      enableSorting: false,
      enableColumnFilter: false,
      meta: {
        label: "ID",
      },
    },
    {
      id: "username",
      accessorKey: "username",
      header: "用户名",
      cell: ({ row }) => <TruncatedCell className="max-w-40" value={row.original.username} />,
      size: 160,
      maxSize: 160,
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: "用户名",
        placeholder: "搜索用户名或邮箱",
        variant: "text",
      },
    },
    {
      id: "email",
      accessorKey: "email",
      header: "邮箱",
      cell: ({ row }) => <TruncatedCell className="max-w-48" value={row.original.email ?? "-"} />,
      size: 192,
      maxSize: 192,
      enableSorting: false,
      enableColumnFilter: false,
      meta: {
        label: "邮箱",
      },
    },
    {
      id: "systemRoleId",
      accessorKey: "systemRoleId",
      header: "系统角色",
      cell: ({ row }) => <Badge variant={row.original.systemRole.key === SYSTEM_ROLES.SUPER_ADMIN.key ? "default" : "secondary"}>{row.original.systemRole.label}</Badge>,
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: "系统角色",
        variant: "multiSelect",
        options: systemRoleOptions,
      },
    },
    {
      id: "businessRoles",
      accessorKey: "businessRoles",
      header: "业务角色",
      cell: ({ row }) => {
        const roles = row.original.businessRoles;
        if (roles.length === 0) {
          return "无";
        }
        const visibleRoles = roles.slice(0, 2);
        const hiddenCount = roles.length - visibleRoles.length;
        const allLabels = roles.map((role) => role.label).join("、");
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex max-w-56 items-center gap-1 overflow-hidden" tabIndex={0}>
                {visibleRoles.map((role) => (
                  <Badge key={role.id} className="max-w-24 shrink truncate" variant="outline">
                    {role.label}
                  </Badge>
                ))}
                {hiddenCount > 0 ? (
                  <Badge className="shrink-0" variant="secondary">
                    +{hiddenCount}
                  </Badge>
                ) : null}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{allLabels}</TooltipContent>
          </Tooltip>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
      meta: {
        label: "业务角色",
      },
    },
    {
      id: "disabled",
      accessorKey: "disabled",
      header: "登录状态",
      cell: ({ row }) => <Badge variant={row.original.disabled ? "destructive" : "secondary"}>{row.original.disabled ? "已禁用" : "正常"}</Badge>,
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: "登录状态",
        variant: "select",
        options: [
          { label: "已禁用", value: "true" },
          { label: "正常", value: "false" },
        ],
      },
    },
    {
      id: "failedLoginAttempts",
      accessorKey: "failedLoginAttempts",
      header: "失败次数",
      enableSorting: false,
      enableColumnFilter: false,
      meta: {
        label: "失败次数",
      },
    },
    {
      id: "lockedUntil",
      accessorKey: "lockedUntil",
      header: "锁定至",
      cell: ({ row }) => (row.original.lockedUntil ? formatDateTime(row.original.lockedUntil) : "未锁定"),
      enableSorting: false,
      enableColumnFilter: false,
      meta: {
        label: "锁定至",
      },
    },
    {
      id: "createdTime",
      accessorKey: "createdTime",
      header: "创建时间",
      cell: ({ row }) => (row.original.createdTime ? formatDateTime(row.original.createdTime) : "—"),
      enableSorting: false,
      meta: {
        label: "创建时间",
      },
    },
    {
      id: "actions",
      header: "操作",
      accessorKey: "actions",
      size: 88,
      cell: (cellContext) => {
        const isSuperAdmin = cellContext.row.original.systemRole.key === SYSTEM_ROLES.SUPER_ADMIN.key;
        return (
          <DataTableActions
            cellContext={cellContext}
            items={
              isSuperAdmin
                ? [{ type: UserAction.edit, tooltip: "编辑用户", icon: RiEditLine }]
                : [
                    { type: UserAction.edit, tooltip: "编辑用户", icon: RiEditLine },
                    { type: UserAction.delete, tooltip: "删除用户", icon: RiDeleteBinLine, variant: "destructive" },
                  ]
            }
            setRowAction={setRowAction}
            visibleCount={1}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
      enableColumnFilter: false,
    },
  ];
}
