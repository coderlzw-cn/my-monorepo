import type { RowData } from "@tanstack/react-table";
import type * as React from "react";

import { dataTableConfig } from "./config";
import { DataTablePagination } from "./data-table-pagination";
import type { DataTableInstance } from "./types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/shadcn/table";
import { getColumnPinningStyle } from "./utils";
import { cn } from "@workspace/ui/lib/utils";

interface DataTableProps<TData extends RowData> extends React.ComponentProps<"div"> {
  table: DataTableInstance<TData>;
  actionBar?: React.ReactNode;
  bordered?: boolean;
  showPagination?: boolean;
}

/**
 * 渲染 `useDataTable` 创建的表格实例。
 *
 * 数据处理与状态由 TanStack Table 负责；本组件只负责语义化 table 标记、
 * 固定列样式、空状态、分页和批量操作区。
 */
export function DataTable<TData extends RowData>({ table, actionBar, bordered = dataTableConfig.bordered, children, className, showPagination = true, ...props }: DataTableProps<TData>) {
  const selectedCount = Object.values(table.state.rowSelection).filter(Boolean).length;
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <div className={cn("flex w-full flex-col gap-2.5 overflow-auto", className)} {...props}>
      {children}
      <div className="overflow-hidden rounded-md border">
        <Table className={cn(bordered && "[&_td]:border-r [&_td:last-child]:border-r-0 [&_th]:border-r [&_th:last-child]:border-r-0")}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{
                      ...getColumnPinningStyle({ column: header.column }),
                    }}
                  >
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        ...getColumnPinningStyle({ column: cell.column }),
                      }}
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumnCount} className="h-24 text-center">
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {showPagination || actionBar ? (
        <div className="flex flex-col gap-2.5">
          {showPagination ? <DataTablePagination table={table} /> : null}
          {actionBar && selectedCount > 0 && actionBar}
        </div>
      ) : null}
    </div>
  );
}
