import { RiLoader4Line, RiAddLine } from "@remixicon/react";
import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { type SetStateAction, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/shadcn/button";
import { Card, CardContent } from "@workspace/ui/components/shadcn/card";
import { DataTable } from "@workspace/ui/components/custom/data-table/data-table";
import { DataTableSkeleton } from "@workspace/ui/components/custom/data-table/data-table-skeleton";
import { DataTableToolbar } from "@workspace/ui/components/custom/data-table/data-table-toolbar";
import { useDataTable } from "@workspace/ui/components/custom/data-table/use-data-table";
import { usePagination } from "@workspace/ui/hooks/use-pagination";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/shadcn/alert-dialog";
import type { DataTableRowAction } from "@workspace/ui/components/custom/data-table/data-table-actions";

import {
  getBusinessRoleFindAllQueryKey,
  useBusinessRoleCreate,
  useBusinessRoleDeleteById,
  useBusinessRoleDeleteMany,
  useBusinessRoleFindAll,
  useBusinessRoleUpdateById,
} from "@/services/generated/business-roles/business-roles";
import type { BusinessRoleFindAllParams, BusinessRoleVo, CreateBusinessRoleDto, UpdateBusinessRoleDto } from "@/services/generated/models";

import { DataTableBatchDeleteButton } from "@/features/dataTable/DataTableBatchDeleteButton";
import { BusinessRoleAction, type BusinessRoleActionType, getBusinessRoleColumns } from "./columns";
import { BusinessRoleFormDialog } from "./BusinessRoleFormDialog";

export default function BusinessRolesPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [rowAction, setRowAction] = useState<DataTableRowAction<BusinessRoleVo, BusinessRoleActionType> | null>(null);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const { page, pageSize, change, setPage } = usePagination({ defaultPageSize: 10 });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const handleRowActionChange = useCallback((action: SetStateAction<DataTableRowAction<BusinessRoleVo, BusinessRoleActionType> | null>) => {
    setIsCreating(false);
    setRowAction(action);
  }, []);
  const columns = useMemo(() => getBusinessRoleColumns({ setRowAction: handleRowActionChange }), [handleRowActionChange]);
  const roleOriginal = rowAction?.row.original ?? null;
  const isEditing = rowAction?.type === BusinessRoleAction.edit;
  const isDeleting = rowAction?.type === BusinessRoleAction.delete;
  const formOpen = isCreating || isEditing;
  const queryParams = useMemo<BusinessRoleFindAllParams>(() => {
    const keywordValue = columnFilters.find((filter) => filter.id === "key")?.value;
    const keyword = typeof keywordValue === "string" ? keywordValue.trim() : undefined;

    return { page, pageSize, ...(keyword ? { keyword } : {}) };
  }, [columnFilters, page, pageSize]);

  const { data, isPending } = useBusinessRoleFindAll(queryParams, {
    query: {
      placeholderData: keepPreviousData,
    },
  });

  const invalidateBusinessRoles = () => {
    void queryClient.invalidateQueries({ queryKey: getBusinessRoleFindAllQueryKey() });
  };

  const refreshBusinessRolesAfterDelete = (deletedCount: number) => {
    invalidateBusinessRoles();
    if (page > 1 && (data?.list.length ?? 0) <= deletedCount) {
      setPage(page - 1);
    }
  };

  const resetFormState = () => {
    setIsCreating(false);
    setRowAction(null);
  };

  const createBusinessRoleMutation = useBusinessRoleCreate({
    mutation: {
      onSuccess: () => {
        toast.success("创建成功");
        resetFormState();
        invalidateBusinessRoles();
      },
    },
  });

  const updateBusinessRoleMutation = useBusinessRoleUpdateById({
    mutation: {
      onSuccess: () => {
        toast.success("更新成功");
        resetFormState();
        invalidateBusinessRoles();
      },
    },
  });

  const savePending = createBusinessRoleMutation.isPending || updateBusinessRoleMutation.isPending;

  const handleSaveBusinessRole = (values: CreateBusinessRoleDto) => {
    if (isEditing && roleOriginal) {
      updateBusinessRoleMutation.mutate({
        roleId: roleOriginal.id,
        data: {
          ...values,
          parentId: values.parentId ?? null,
        } as UpdateBusinessRoleDto,
      });
      return;
    }
    createBusinessRoleMutation.mutate({ data: values });
  };

  const deleteMutation = useBusinessRoleDeleteById({
    mutation: {
      onSuccess: () => {
        toast.success("删除成功");
        setRowAction(null);
        table.resetRowSelection();
        refreshBusinessRolesAfterDelete(1);
      },
    },
  });
  const deleteManyMutation = useBusinessRoleDeleteMany({
    mutation: {
      onSuccess: () => {
        toast.success("删除成功");
        table.resetRowSelection();
        setBatchDeleteOpen(false);
        refreshBusinessRolesAfterDelete(selectedIds.length);
      },
    },
  });

  const { table } = useDataTable({
    columns,
    data: data?.list ?? [],
    getRowId: (role) => role.id,
    autoResetAll: false,
    manualPagination: true,
    manualFiltering: true,
    enableSorting: false,
    pageCount: data?.pages ?? 1,
    rowCount: data?.total ?? 0,
    pagination: { pageIndex: page - 1, pageSize },
    onPaginationChange: (pagination) => {
      change(pagination.pageIndex + 1, pagination.pageSize);
    },
    columnFilters,
    onColumnFiltersChange: (filters) => {
      setColumnFilters(filters);
      setPage(1);
    },
  });
  const selectedIds = Object.entries(table.state.rowSelection)
    .filter(([, selected]) => selected)
    .map(([id]) => id);
  return (
    <section className="flex flex-col gap-4">
      {isPending && !data ? <DataTableSkeleton columnCount={columns.length} filterCount={1} /> : null}

      {data ? (
        <div className="flex flex-col gap-2.5">
          <Card className="p-2">
            <CardContent className="p-0">
              <DataTableToolbar table={table}>
                <DataTableBatchDeleteButton count={selectedIds.length} onDelete={() => setBatchDeleteOpen(true)} />
                <Button
                  size="sm"
                  type="button"
                  onClick={() => {
                    setRowAction(null);
                    setIsCreating(true);
                  }}
                >
                  <RiAddLine />
                  新建角色
                </Button>
              </DataTableToolbar>
            </CardContent>
          </Card>
          <Card className="px-3 py-4">
            <CardContent className="space-y-4 px-0">
              <DataTable table={table} />
            </CardContent>
          </Card>
        </div>
      ) : null}

      <BusinessRoleFormDialog
        isPending={savePending}
        open={formOpen}
        role={isEditing ? roleOriginal : null}
        onOpenChange={(open) => {
          if (!open && !savePending) {
            setIsCreating(false);
            setRowAction(null);
          }
        }}
        onSubmit={handleSaveBusinessRole}
      />
      <AlertDialog open={isDeleting} onOpenChange={(open) => !open && !deleteMutation.isPending && setRowAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除业务角色</AlertDialogTitle>
            <AlertDialogDescription>{isDeleting && roleOriginal ? `确定删除业务角色 ${roleOriginal.label} 吗？仅当没有子角色且未分配用户时才能删除。` : null}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                if (roleOriginal) deleteMutation.mutate({ roleId: roleOriginal.id });
              }}
            >
              {deleteMutation.isPending && <RiLoader4Line aria-hidden="true" className="mr-2 size-4 animate-spin" />}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={batchDeleteOpen} onOpenChange={(open) => !open && !deleteManyMutation.isPending && setBatchDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>批量删除业务角色</AlertDialogTitle>
            <AlertDialogDescription>{`确定删除已选的 ${selectedIds.length} 个业务角色吗？仅当它们没有子角色且未分配用户时才能删除。`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteManyMutation.isPending}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteManyMutation.isPending}
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                if (selectedIds.length > 0) deleteManyMutation.mutate({ data: { ids: selectedIds } });
              }}
            >
              {deleteManyMutation.isPending && <RiLoader4Line aria-hidden="true" className="mr-2 size-4 animate-spin" />}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
