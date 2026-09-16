import { RiEditLine, RiDeleteBinLine } from "@remixicon/react";
import { type Dispatch, type SetStateAction } from "react";

import { formatDateTime } from "@workspace/utils/shared/date";
import { createDataTableSelectionColumn } from "@/features/dataTable/data-table-selection";
import type { BusinessRoleVo } from "@/services/generated/models";
import type { DataTableColumnDef, DataTableRowAction } from "@workspace/ui/components/custom/data-table/types";
import { DataTableActions } from "@workspace/ui/components/custom/data-table/data-table-actions";

export const BusinessRoleAction = {
  edit: "edit",
  delete: "delete",
} as const;

export type BusinessRoleActionType = (typeof BusinessRoleAction)[keyof typeof BusinessRoleAction];

export type BusinessRoleColumnActions = {
  setRowAction: Dispatch<SetStateAction<DataTableRowAction<BusinessRoleVo, BusinessRoleActionType> | null>>;
};

export function getBusinessRoleColumns({ setRowAction }: BusinessRoleColumnActions): DataTableColumnDef<BusinessRoleVo>[] {
  return [
    createDataTableSelectionColumn({ getLabel: (role: BusinessRoleVo) => role.label }),
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
      id: "level",
      accessorKey: "level",
      header: "级别",
      enableSorting: false,
      enableColumnFilter: false,
      meta: {
        label: "级别",
      },
    },
    {
      id: "parentId",
      accessorKey: "parentId",
      header: "父角色",
      cell: ({ row }) => row.original.parent?.label ?? "顶级",
      enableSorting: false,
      enableColumnFilter: false,
      meta: {
        label: "父角色",
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
      cell: (cellContext) => (
        <DataTableActions
          cellContext={cellContext}
          items={[
            { type: BusinessRoleAction.edit, tooltip: "编辑角色", icon: RiEditLine },
            { type: BusinessRoleAction.delete, tooltip: "删除角色", icon: RiDeleteBinLine, variant: "destructive" },
          ]}
          setRowAction={setRowAction}
          visibleCount={1}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      enableColumnFilter: false,
    },
  ];
}
