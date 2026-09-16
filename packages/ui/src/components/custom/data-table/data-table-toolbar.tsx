"use client";

import type { RowData } from "@tanstack/react-table";
import { RiSearchLine, RiCloseLine } from "@remixicon/react";
import * as React from "react";

import { DataTableDateFilter } from "./data-table-date-filter";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableSliderFilter } from "./data-table-slider-filter";
import { DataTableViewOptions } from "./data-table-view-options";
import type { DataTableColumn, DataTableInstance } from "./types";
import { Button } from "@workspace/ui/components/shadcn/button";
import { Input } from "@workspace/ui/components/shadcn/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@workspace/ui/components/shadcn/input-group";
import { cn } from "@workspace/ui/lib/utils";

interface DataTableToolbarProps<TData extends RowData> extends React.ComponentProps<"div"> {
  table: DataTableInstance<TData>;
}

/**
 * 根据列 `meta.variant` 自动选择文本、数值、日期或分面筛选器。
 * 筛选状态直接读写 `table.state.columnFilters`，调用方无需重复传入状态快照。
 */
export function DataTableToolbar<TData extends RowData>({ table, children, className, ...props }: DataTableToolbarProps<TData>) {
  const filters = table.state.columnFilters;
  const isFiltered = filters.length > 0;

  const columns = React.useMemo(() => table.getAllColumns().filter((column) => column.getCanFilter()), [table]);

  const onReset = React.useCallback(() => {
    table.resetColumnFilters();
  }, [table]);

  return (
    <div role="toolbar" aria-orientation="horizontal" className={cn("flex w-full items-start justify-between gap-2 p-1", className)} {...props}>
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {columns.map((column) => (
          <DataTableToolbarFilter key={column.id} column={column} filterValue={filters.find((item) => item.id === column.id)?.value} />
        ))}
        {isFiltered && (
          <Button aria-label="重置筛选" variant="outline" className="border-dashed" onClick={onReset}>
            <RiCloseLine />
            重置
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        <DataTableViewOptions table={table} align="end" />
      </div>
    </div>
  );
}
interface DataTableToolbarFilterProps<TData extends RowData> {
  column: DataTableColumn<TData>;
  filterValue: unknown;
}

function DataTableToolbarFilter<TData extends RowData>({ column, filterValue }: DataTableToolbarFilterProps<TData>) {
  const columnMeta = column.columnDef.meta;
  if (!columnMeta?.variant) return null;

  switch (columnMeta.variant) {
    case "text":
      return <DataTableTextFilter column={column} filterValue={filterValue} placeholder={columnMeta.placeholder ?? columnMeta.label} />;

    case "number":
      return (
        <div className="relative">
          <Input
            type="number"
            inputMode="numeric"
            placeholder={columnMeta.placeholder ?? columnMeta.label}
            value={typeof filterValue === "string" ? filterValue : ""}
            onChange={(event) => column.setFilterValue(event.target.value)}
            className={cn("h-8 w-30", columnMeta.unit && "pr-8")}
          />
          {columnMeta.unit && <span className="absolute inset-y-0 right-0 flex items-center rounded-r-md bg-accent px-2 text-sm text-muted-foreground">{columnMeta.unit}</span>}
        </div>
      );

    case "range":
      return <DataTableSliderFilter column={column} title={columnMeta.label ?? column.id} />;

    case "date":
    case "dateRange":
      return <DataTableDateFilter column={column} title={columnMeta.label ?? column.id} multiple={columnMeta.variant === "dateRange"} />;

    case "select":
    case "multiSelect":
      return (
        <DataTableFacetedFilter column={column} filterValue={filterValue} title={columnMeta.label ?? column.id} options={columnMeta.options ?? []} multiple={columnMeta.variant === "multiSelect"} />
      );

    default:
      return null;
  }
}

const TEXT_FILTER_DEBOUNCE_MS = 300;

interface DataTableTextFilterProps<TData extends RowData> {
  column: DataTableColumn<TData>;
  filterValue: unknown;
  placeholder?: string;
}

/**
 * 文本筛选使用本地输入状态，避免每次按键都触发服务端请求。
 * 中文输入法在组合阶段会产生未确认的拼音，因此仅在 compositionend 后开始防抖。
 */
function DataTableTextFilter<TData extends RowData>({ column, filterValue, placeholder }: DataTableTextFilterProps<TData>) {
  const externalValue = typeof filterValue === "string" ? filterValue : "";
  const [inputValue, setInputValue] = React.useState(externalValue);
  const isComposingRef = React.useRef(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearPendingUpdate = React.useCallback(() => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const scheduleFilterUpdate = React.useCallback(
    (value: string) => {
      clearPendingUpdate();
      timerRef.current = setTimeout(() => {
        column.setFilterValue(value);
        timerRef.current = undefined;
      }, TEXT_FILTER_DEBOUNCE_MS);
    },
    [clearPendingUpdate, column],
  );

  React.useEffect(() => {
    if (!isComposingRef.current) {
      clearPendingUpdate();
      setInputValue(externalValue);
    }
  }, [clearPendingUpdate, externalValue]);

  React.useEffect(() => clearPendingUpdate, [clearPendingUpdate]);

  return (
    <InputGroup className="h-9 w-40 lg:w-64">
      <InputGroupAddon>
        <RiSearchLine />
      </InputGroupAddon>
      <InputGroupInput
        placeholder={placeholder}
        value={inputValue}
        onChange={(event) => {
          const value = event.target.value;
          setInputValue(value);
          if (!isComposingRef.current) {
            scheduleFilterUpdate(value);
          }
        }}
        onCompositionStart={() => {
          isComposingRef.current = true;
          clearPendingUpdate();
        }}
        onCompositionEnd={(event) => {
          isComposingRef.current = false;
          const value = event.currentTarget.value;
          setInputValue(value);
          scheduleFilterUpdate(value);
        }}
      />
    </InputGroup>
  );
}
