import {
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type PaginationState,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type TableState,
  type Updater,
  functionalUpdate,
  useTable,
} from "@tanstack/react-table";
import * as React from "react";

import { dataTableFeatures, type DataTableFeatures } from "./data-table-features";
import type { DataTableInstance, ExtendedColumnSort } from "./types";

interface UseDataTableProps<TData extends RowData> extends Omit<
  TableOptions<DataTableFeatures, TData>,
  "features" | "state" | "onColumnFiltersChange" | "onColumnVisibilityChange" | "onPaginationChange" | "onRowSelectionChange" | "onSortingChange"
> {
  initialState?: Omit<Partial<TableState<DataTableFeatures>>, "sorting"> & {
    sorting?: ExtendedColumnSort<TData>[];
  };
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
}

/**
 * 创建项目标准 DataTable 实例。
 *
 * 该 hook 集中控制分页、排序、列显隐、行选择和列筛选状态，并屏蔽
 * feature 注册与默认列配置。调用方应从 `table.state` 读取状态，通过 table API
 * 更新状态，不要读取已废弃的 `table.store.state`。
 */
export function useDataTable<TData extends RowData>(props: UseDataTableProps<TData>) {
  const { columns, data, initialState, pagination: controlledPagination, onPaginationChange, columnFilters: controlledColumnFilters, onColumnFiltersChange, ...tableProps } = props;

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(initialState?.rowSelection ?? {});
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>(initialState?.columnVisibility ?? {});
  const [paginationState, setPaginationState] = React.useState<PaginationState>({
    pageIndex: initialState?.pagination?.pageIndex ?? 0,
    pageSize: initialState?.pagination?.pageSize ?? 10,
  });
  const [sorting, setSorting] = React.useState<SortingState>(initialState?.sorting ?? []);
  const [columnFiltersState, setColumnFilters] = React.useState<ColumnFiltersState>(initialState?.columnFilters ?? []);
  const pagination = controlledPagination ?? paginationState;
  const columnFilters = controlledColumnFilters ?? columnFiltersState;

  const handlePaginationChange = React.useCallback(
    (updater: Parameters<NonNullable<TableOptions<DataTableFeatures, TData>["onPaginationChange"]>>[0]) => {
      const nextPagination = functionalUpdate(updater, pagination);
      if (controlledPagination === undefined) {
        setPaginationState(nextPagination);
      }
      onPaginationChange?.(nextPagination);
    },
    [controlledPagination, onPaginationChange, pagination],
  );

  const handleColumnFiltersChange = React.useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      const nextFilters = functionalUpdate(updater, columnFilters);
      if (controlledColumnFilters === undefined) {
        setColumnFilters(nextFilters);
      }
      onColumnFiltersChange?.(nextFilters);
    },
    [columnFilters, controlledColumnFilters, onColumnFiltersChange],
  );

  const table: DataTableInstance<TData> = useTable({
    ...tableProps,
    features: dataTableFeatures,
    columns,
    data,
    initialState,
    state: {
      pagination,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    defaultColumn: {
      ...tableProps.defaultColumn,
      enableColumnFilter: false,
    },
    enableRowSelection: true,
    enableRowRangeSelection: false,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: handlePaginationChange,
    onSortingChange: setSorting,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
  });

  return { table };
}
