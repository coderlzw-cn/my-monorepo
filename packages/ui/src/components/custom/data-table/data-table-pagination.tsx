import type { RowData } from "@tanstack/react-table";
import type * as React from "react";

import { cn } from "@workspace/ui/lib/utils";
import type { DataTableInstance } from "./types";
import { Pagination } from "../pagination";

interface DataTablePaginationProps<TData extends RowData> extends React.ComponentProps<"div"> {
  table: DataTableInstance<TData>;
  pageSizeOptions?: number[];
}

/** 将 TanStack Table 的分页状态适配到 UI 包的通用 Pagination 组件。 */
export function DataTablePagination<TData extends RowData>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
  className,
  ...props
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.state.pagination;

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-4 overflow-auto p-1 sm:flex-row sm:items-center sm:justify-between sm:gap-8",
        className,
      )}
      {...props}
    >
      <div className="flex-1 text-sm whitespace-nowrap text-muted-foreground">
        已选 {table.getFilteredSelectedRowModel().rows.length} /{" "}
        {table.getFilteredRowModel().rows.length} 行
      </div>
      <Pagination
        className="shrink-0"
        current={pageIndex + 1}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        showLessItems
        showQuickJumper
        showSizeChanger
        showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
        total={table.getRowCount()}
        onChange={(page, nextPageSize) => {
          table.setPagination({ pageIndex: page - 1, pageSize: nextPageSize });
        }}
      />
    </div>
  );
}
