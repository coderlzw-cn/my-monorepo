import { RiLoader4Line } from "@remixicon/react";
import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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

import { DataTableBatchDeleteButton } from "@/features/dataTable/DataTableBatchDeleteButton";
import type { UsersFindAllParams, UserVo } from "@/services/generated/models";
import { useSystemRolesFindAll } from "@/services/generated/system-roles/system-roles";
import { getUsersFindAllQueryKey, useUsersDeleteById, useUsersDeleteMany, useUsersFindAll, useUsersUpdateById } from "@/services/generated/users/users";
import { Card, CardContent } from "@workspace/ui/components/shadcn/card";
import { getUserColumns, UserAction, type UserActionType } from "./columns";
import { UserEditFormDialog } from "./UserEditFormDialog";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [rowAction, setRowAction] = useState<DataTableRowAction<UserVo, UserActionType> | null>(null);
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const { page, pageSize, change, setPage } = usePagination({ defaultPageSize: 50 });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { data: systemRoles } = useSystemRolesFindAll({ page: 1, pageSize: 100 });
  const queryParams = useMemo<UsersFindAllParams>(() => {
    const getFilterValue = (id: string) => columnFilters.find((filter) => filter.id === id)?.value;
    const keywordValue = getFilterValue("username");
    const roleIdValue = getFilterValue("systemRoleId");
    const disabledValue = getFilterValue("disabled");
    const keyword = typeof keywordValue === "string" ? keywordValue.trim() : undefined;
    const systemRoleId = Array.isArray(roleIdValue) ? roleIdValue.filter((id): id is string => typeof id === "string") : undefined;
    const disabledFilter = Array.isArray(disabledValue) ? disabledValue[0] : disabledValue;
    const disabled = disabledFilter === "true" ? true : disabledFilter === "false" ? false : undefined;

    return {
      page,
      pageSize,
      ...(keyword ? { keyword } : {}),
      ...(systemRoleId?.length ? { systemRoleId } : {}),
      ...(disabled !== undefined ? { disabled } : {}),
    };
  }, [columnFilters, page, pageSize]);
  const columns = useMemo(
    () =>
      getUserColumns({
        setRowAction,
        systemRoleOptions: (systemRoles?.list ?? []).map((item) => ({ label: item.label, value: item.id })),
      }),
    [systemRoles?.list],
  );

  const userOriginal = rowAction?.row.original ?? null;
  const isEditing = rowAction?.type === UserAction.edit;
  const isDeleting = rowAction?.type === UserAction.delete;

  const { data, isPending } = useUsersFindAll(queryParams, {
    query: {
      placeholderData: keepPreviousData,
    },
  });

  const refreshUsersAfterDelete = (deletedCount: number) => {
    void queryClient.invalidateQueries({ queryKey: getUsersFindAllQueryKey() });
    if (page > 1 && (data?.list.length ?? 0) <= deletedCount) {
      setPage(page - 1);
    }
  };

  const updateUserMutation = useUsersUpdateById({
    mutation: {
      onSuccess: () => {
        toast.success("更新成功");
        setRowAction(null);
        void queryClient.invalidateQueries({ queryKey: getUsersFindAllQueryKey() });
      },
    },
  });

  const deleteMutation = useUsersDeleteById({
    mutation: {
      onSuccess: () => {
        toast.success("删除成功");
        setRowAction(null);
        table.resetRowSelection();
        refreshUsersAfterDelete(1);
      },
    },
  });

  const { table } = useDataTable({
    columns,
    data: data?.list ?? [],
    getRowId: (user) => String(user.id),
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

  const deleteManyMutation = useUsersDeleteMany({
    mutation: {
      onSuccess: () => {
        toast.success("删除成功");
        setIsBatchDeleteOpen(false);
        table.resetRowSelection();
        refreshUsersAfterDelete(selectedIds.length);
      },
    },
  });

  return (
    <section aria-labelledby="users-page-title" className="flex flex-col gap-4">
      {isPending && <DataTableSkeleton columnCount={columns.length} filterCount={3} />}
      {data ? (
        <>
          <Card className="sticky -top-4 z-20 p-2">
            <CardContent className="p-0">
              <DataTableToolbar table={table}>
                <DataTableBatchDeleteButton count={selectedIds.length} onDelete={() => setIsBatchDeleteOpen(true)} />
              </DataTableToolbar>
            </CardContent>
          </Card>
          <Card className="px-3 py-4">
            <CardContent className="px-0">
              <DataTable table={table} />
            </CardContent>
          </Card>
        </>
      ) : null}

      <UserEditFormDialog
        isPending={updateUserMutation.isPending}
        open={isEditing}
        user={isEditing ? userOriginal : null}
        onOpenChange={(open) => {
          if (!open && !updateUserMutation.isPending) {
            setRowAction(null);
          }
        }}
        onSubmit={(values) => {
          if (!userOriginal) {
            return;
          }
          updateUserMutation.mutate({ id: userOriginal.id, data: values });
        }}
      />
      <AlertDialog open={isDeleting} onOpenChange={(open) => !open && !deleteMutation.isPending && setRowAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除用户</AlertDialogTitle>
            <AlertDialogDescription>{isDeleting && userOriginal ? `确定删除用户 ${userOriginal.username} 吗？此操作不可撤销。` : null}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                if (userOriginal) deleteMutation.mutate({ id: userOriginal.id });
              }}
            >
              {deleteMutation.isPending && <RiLoader4Line aria-hidden="true" className="mr-2 size-4 animate-spin" />}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isBatchDeleteOpen} onOpenChange={(open) => !open && !deleteManyMutation.isPending && setIsBatchDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>批量删除用户</AlertDialogTitle>
            <AlertDialogDescription>{`确定删除已选的 ${selectedIds.length} 个用户吗？此操作不可撤销。`}</AlertDialogDescription>
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
