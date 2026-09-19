import type * as React from "react";
import type { RowData } from "@tanstack/react-table";

import { dataTableConfig } from "./config";
import type { DataTableColumn, ExtendedColumnFilter, FilterOperator, FilterVariant } from "./types";

/**
 * 生成固定列所需的 sticky 定位与边界阴影样式。
 *
 * 应同时应用到同一列的表头和单元格，避免横向滚动时宽度或层级错位。
 */
export function getColumnPinningStyle<TData extends RowData>({
  column,
  withBorder = false,
}: {
  column: DataTableColumn<TData>;
  withBorder?: boolean;
}): React.CSSProperties {
  const isPinned = column.getIsPinned();
  const isLastStartPinnedColumn = isPinned === "start" && column.getIsLastColumn("start");
  const isFirstEndPinnedColumn = isPinned === "end" && column.getIsFirstColumn("end");

  return {
    boxShadow: withBorder
      ? isLastStartPinnedColumn
        ? "-4px 0 4px -4px var(--border) inset"
        : isFirstEndPinnedColumn
          ? "4px 0 4px -4px var(--border) inset"
          : undefined
      : undefined,
    insetInlineStart: isPinned === "start" ? `${column.getStart("start")}px` : undefined,
    insetInlineEnd: isPinned === "end" ? `${column.getAfter("end")}px` : undefined,
    opacity: isPinned ? 0.97 : 1,
    position: isPinned ? "sticky" : "relative",
    background: isPinned ? "var(--background)" : "var(--background)",
    width: column.getSize(),
    zIndex: isPinned ? 1 : undefined,
  };
}

/** 返回指定筛选控件可用的服务端查询操作符。 */
export function getFilterOperators(filterVariant: FilterVariant) {
  const operatorMap: Record<FilterVariant, { label: string; value: FilterOperator }[]> = {
    text: dataTableConfig.textOperators,
    number: dataTableConfig.numericOperators,
    range: dataTableConfig.numericOperators,
    date: dataTableConfig.dateOperators,
    dateRange: dataTableConfig.dateOperators,
    boolean: dataTableConfig.booleanOperators,
    select: dataTableConfig.selectOperators,
    multiSelect: dataTableConfig.multiSelectOperators,
  };

  return operatorMap[filterVariant] ?? dataTableConfig.textOperators;
}

/** 返回筛选控件首次创建条件时使用的默认操作符。 */
export function getDefaultFilterOperator(filterVariant: FilterVariant) {
  const operators = getFilterOperators(filterVariant);

  return operators[0]?.value ?? (filterVariant === "text" ? "iLike" : "eq");
}

/**
 * 移除没有实际值的筛选条件；`isEmpty` 和 `isNotEmpty` 不需要值，因此始终保留。
 */
export function getValidFilters<TData>(
  filters: ExtendedColumnFilter<TData>[],
): ExtendedColumnFilter<TData>[] {
  return filters.filter(
    (filter) =>
      filter.operator === "isEmpty" ||
      filter.operator === "isNotEmpty" ||
      (Array.isArray(filter.value)
        ? filter.value.length > 0
        : filter.value !== "" && filter.value !== null && filter.value !== undefined),
  );
}
