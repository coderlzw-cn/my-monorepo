import { RiEditLine, RiDeleteBinLine } from "@remixicon/react";
import { type Dispatch, type SetStateAction } from "react";

import { createDataTableSelectionColumn } from "@/features/dataTable/data-table-selection";
import { Badge } from "@workspace/ui/components/shadcn/badge";
import { DataTableActions } from "@workspace/ui/components/custom/data-table/data-table-actions";
import type { DataTableRowAction, DataTableColumnDef } from "@workspace/ui/components/custom/data-table/types";
import type { SystemRoleVo } from "@/services/generated/models/systemRoleVo";
import { formatDateTime } from "@workspace/utils/shared/date";

export const SystemRoleAction = {
  edit: "edit",
  delete: "delete",
} as const;

export type SystemRoleActionType = (typeof SystemRoleAction)[keyof typeof SystemRoleAction];

export type SystemRoleColumnActions = {
  setRowAction: Dispatch<SetStateAction<DataTableRowAction<SystemRoleVo, SystemRoleActionType> | null>>;
};

export function getSystemRoleColumns({ setRowAction }: SystemRoleColumnActions): DataTableColumnDef<SystemRoleVo>[] {
  return [
    createDataTableSelectionColumn({ getLabel: (role: SystemRoleVo) => role.label, canSelect: (role: SystemRoleVo) => !role.builtin }),
    {
      id: "key",
      accessorKey: "key",
      header: "标识",
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: "标识",
        placeholder: "搜索标识、名称或说明",
        variant: "text",
      },
    },
    {
      id: "label",
      accessorKey: "label",
      header: "名称",
      enableSorting: false,
      enableColumnFilter: false,
      meta: {
        label: "名称",
      },
    },
    {
      id: "description",
      accessorKey: "description",
      header: "说明",
      cell: ({ row }) => row.original.description || "无",
      enableSorting: false,
      enableColumnFilter: false,
      meta: {
        label: "说明",
      },
    },
    {
      id: "builtin",
      accessorKey: "builtin",
      header: "类型",
      cell: ({ row }) => <Badge variant={row.original.builtin ? "default" : "outline"}>{row.original.builtin ? "内置" : "自定义"}</Badge>,
      enableSorting: false,
      enableColumnFilter: false,
      meta: {
        label: "类型",
      },
    },
    {
      id: "userCount",
      accessorKey: "userCount",
      header: "用户数",
      enableSorting: false,
      enableColumnFilter: false,
      meta: {
        label: "用户数",
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
        if (cellContext.row.original.builtin) {
          return <span className="text-muted-foreground">不可修改</span>;
        }
        return (
          <DataTableActions
            cellContext={cellContext}
            items={[
              { type: SystemRoleAction.edit, tooltip: "编辑角色", icon: RiEditLine },
              { type: SystemRoleAction.delete, tooltip: "删除角色", icon: RiDeleteBinLine, variant: "destructive" },
            ]}
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
