import { RiMoreFill, type RemixiconComponentType } from "@remixicon/react";
import type { RowData } from "@tanstack/react-table";
import { Fragment, type Dispatch, type SetStateAction } from "react";

import { Button } from "@workspace/ui/components/shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@workspace/ui/components/shadcn/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/shadcn/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import type { DataTableCellContext, DataTableRowAction } from "./types";

export type { DataTableRowAction };

/** 单个行级操作的图标、文案和业务操作标识。 */
export interface DataTableActionItem<TAction extends string = string> {
  icon: RemixiconComponentType;
  tooltip: string;
  type: TAction;
  variant?: "default" | "destructive";
}

/** 行级操作组参数，`TData` 与列定义中的 VO 类型保持一致。 */
export interface DataTableActionsProps<TData extends RowData, TAction extends string = string> {
  cellContext: DataTableCellContext<TData, unknown>;
  items: DataTableActionItem<TAction>[];
  setRowAction: Dispatch<SetStateAction<DataTableRowAction<TData, TAction> | null>>;
  /** 直接展示的操作数量，其余操作收纳到“更多”菜单；不传时全部直接展示。 */
  visibleCount?: number;
}

/** 渲染带可访问名称和提示的行级图标操作，点击后将行与操作类型回传页面。 */
export function DataTableActions<TData extends RowData, TAction extends string = string>({ cellContext, items, setRowAction, visibleCount = items.length }: DataTableActionsProps<TData, TAction>) {
  const visibleItems = items.slice(0, visibleCount);
  const overflowItems = items.slice(visibleCount);
  const selectAction = (type: TAction) => setRowAction({ type, row: cellContext.row });

  return (
    <div className="flex items-center gap-3">
      {visibleItems.map((item, index) => (
        <Tooltip key={`${item.type}-${index}`} disableHoverableContent>
          <TooltipTrigger asChild>
            <Button
              aria-label={item.tooltip}
              className={cn("size-8 rounded-md p-0 transition-all hover:bg-primary/10 hover:text-primary", item.variant === "destructive" && "group")}
              type="button"
              variant="ghost"
              onClick={() => selectAction(item.type)}
            >
              <item.icon className={cn("size-4", item.variant === "destructive" && "text-red-500/80 transition-colors group-focus:text-red-600 dark:group-focus:text-red-400")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="px-2.5 py-1.5 text-xs" side="top">
            {item.tooltip}
          </TooltipContent>
        </Tooltip>
      ))}
      {overflowItems.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-label="更多操作" className="size-8 rounded-md p-0" type="button" variant="ghost">
              <RiMoreFill aria-hidden="true" className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-36">
            {overflowItems.map((item, index) => (
              <Fragment key={`${item.type}-${index}`}>
                {item.variant === "destructive" && index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem variant={item.variant} onSelect={() => selectAction(item.type)}>
                  <item.icon aria-hidden="true" />
                  {item.tooltip}
                </DropdownMenuItem>
              </Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
