import type {
  CellContext,
  Column,
  ColumnDef,
  ColumnSort,
  ReactTable,
  Row,
  RowData,
} from "@tanstack/react-table";
import type * as React from "react";

import type { DataTableFeatures } from "./data-table-features";
import type { DataTableConfig } from "./config";

declare module "@tanstack/react-table" {
  /** 项目级列元数据；工具栏根据 `variant` 选择对应的筛选控件。 */
  interface ColumnMeta<TFeatures, TData extends RowData, TValue> {
    label?: string;
    placeholder?: string;
    variant?: FilterVariant;
    options?: Option[];
    range?: [number, number];
    unit?: string;
    icon?: React.ComponentType<React.ComponentProps<"svg">>;
  }
}

/** select 与 multiSelect 筛选器使用的选项结构。 */
export interface Option {
  label: string;
  value: string | boolean;
  count?: number;
  icon?: React.ComponentType<React.ComponentProps<"svg">>;
}

/** 服务端筛选协议支持的比较操作符。 */
export type FilterOperator = DataTableConfig["operators"][number];
/** 决定工具栏筛选控件形态的列元数据值。 */
export type FilterVariant = DataTableConfig["filterVariants"][number];
/** 多条件查询的逻辑连接符。 */
export type JoinOperator = DataTableConfig["joinOperators"][number];

/** 可序列化为服务端查询参数的基础筛选条件。 */
export interface FilterItemSchema {
  id: string;
  value: string | string[];
  variant: FilterVariant;
  operator: FilterOperator;
  filterId: string;
}

/** 将排序列 id 约束为数据 VO 的字符串键。 */
export interface ExtendedColumnSort<TData> extends Omit<ColumnSort, "id"> {
  id: Extract<keyof TData, string>;
}

/** 将筛选列 id 约束为数据 VO 的字符串键。 */
export interface ExtendedColumnFilter<TData> extends FilterItemSchema {
  id: Extract<keyof TData, string>;
}

/** 对 TanStack v9 ColumnDef 绑定项目的 feature 注册表。 */
export type DataTableColumnDef<TData extends RowData, TValue = unknown> = ColumnDef<
  DataTableFeatures,
  TData,
  TValue
>;

/** 项目 DataTable 实例类型；只暴露已注册 feature 贡献的 API。 */
export type DataTableInstance<TData extends RowData> = ReactTable<DataTableFeatures, TData>;

/** 单列实例类型，用于列头、筛选器和固定列工具。 */
export type DataTableColumn<TData extends RowData, TValue = unknown> = Column<
  DataTableFeatures,
  TData,
  TValue
>;

/** 行实例类型，保留原始数据 `row.original` 的完整类型。 */
export type DataTableRow<TData extends RowData> = Row<DataTableFeatures, TData>;

/** 列 cell 回调的上下文类型。 */
export type DataTableCellContext<TData extends RowData, TValue = unknown> = CellContext<
  DataTableFeatures,
  TData,
  TValue
>;

/** 将操作标识与当前行实例绑定，供页面统一管理行级对话框。 */
export interface DataTableRowAction<TData extends RowData, TAction extends string = string> {
  type: TAction;
  row: DataTableRow<TData>;
}
