"use client";

import type { RowData } from "@tanstack/react-table";
import { RiSettings3Line } from "@remixicon/react";

import { Button } from "@workspace/ui/components/shadcn/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@workspace/ui/components/shadcn/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";
import type { DataTableInstance } from "./types";

interface DataTableViewOptionsProps<TData extends RowData> {
  table: DataTableInstance<TData>;
  disabled?: boolean;
  className?: string;
  align?: "start" | "center" | "end";
}

function getColumnLabel(column: { id: string; columnDef: { meta?: { label?: string } } }) {
  return column.columnDef.meta?.label ?? column.id;
}

/** 显示所有允许隐藏的 accessor 列，并通过 column visibility API 切换可见性。 */
export function DataTableViewOptions<TData extends RowData>({ table, disabled, className, align = "end" }: DataTableViewOptionsProps<TData>) {
  const columns = table.getAllColumns().filter((column) => column.getCanHide() && column.accessorFn);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="切换列显示" variant="outline" className="ml-auto hidden h-8 lg:flex" disabled={disabled}>
          <RiSettings3Line className="text-muted-foreground" />
          列设置
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={cn("w-44", className)} onCloseAutoFocus={(event) => event.preventDefault()}>
        <DropdownMenuLabel>显示列</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(visible) => {
              column.toggleVisibility(!!visible);
            }}
          >
            {getColumnLabel(column)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
