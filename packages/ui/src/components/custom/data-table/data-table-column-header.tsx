"use client";

import type { RowData } from "@tanstack/react-table";
import type * as React from "react";
import {
  RiArrowDownSLine,
  RiExpandUpDownLine,
  RiArrowUpSLine,
  RiEyeOffLine,
  RiCloseLine,
} from "@remixicon/react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/shadcn/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";
import type { DataTableColumn } from "./types";

interface DataTableColumnHeaderProps<TData extends RowData, TValue> extends React.ComponentProps<
  typeof DropdownMenuTrigger
> {
  column: DataTableColumn<TData, TValue>;
  label: string;
}

/** 可排序、清除排序并隐藏当前列的统一列头；能力由 column feature 自动判定。 */
export function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  label,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort() && !column.getCanHide()) {
    return <div className={cn(className)}>{label}</div>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "-ml-1.5 flex h-8 items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-accent focus:ring-1 focus:ring-ring focus:outline-none data-[state=open]:bg-accent [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
          className,
        )}
        {...props}
      >
        {label}
        {column.getCanSort() &&
          (column.getIsSorted() === "desc" ? (
            <RiArrowDownSLine />
          ) : column.getIsSorted() === "asc" ? (
            <RiArrowUpSLine />
          ) : (
            <RiExpandUpDownLine />
          ))}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-28">
        {column.getCanSort() && (
          <>
            <DropdownMenuCheckboxItem
              className="relative pr-8 pl-2 [&_svg]:text-muted-foreground [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
              checked={column.getIsSorted() === "asc"}
              onClick={() => column.toggleSorting(false)}
            >
              <RiArrowUpSLine />
              升序
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              className="relative pr-8 pl-2 [&_svg]:text-muted-foreground [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
              checked={column.getIsSorted() === "desc"}
              onClick={() => column.toggleSorting(true)}
            >
              <RiArrowDownSLine />
              降序
            </DropdownMenuCheckboxItem>
            {column.getIsSorted() && (
              <DropdownMenuItem
                className="pl-2 [&_svg]:text-muted-foreground"
                onClick={() => column.clearSorting()}
              >
                <RiCloseLine />
                重置
              </DropdownMenuItem>
            )}
          </>
        )}
        {column.getCanHide() && (
          <DropdownMenuCheckboxItem
            className="relative pr-8 pl-2 [&_svg]:text-muted-foreground [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
            checked={!column.getIsVisible()}
            onClick={() => column.toggleVisibility(false)}
          >
            <RiEyeOffLine />
            隐藏
          </DropdownMenuCheckboxItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
