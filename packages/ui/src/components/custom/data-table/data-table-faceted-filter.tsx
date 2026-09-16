"use client";

import type { RowData } from "@tanstack/react-table";
import { RiCheckLine, RiAddCircleLine, RiCloseCircleLine } from "@remixicon/react";
import * as React from "react";

import { Badge } from "@workspace/ui/components/shadcn/badge";
import { Button } from "@workspace/ui/components/shadcn/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@workspace/ui/components/shadcn/command";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/shadcn/popover";
import { Separator } from "@workspace/ui/components/shadcn/separator";
import { cn } from "@workspace/ui/lib/utils";
import type { DataTableColumn, Option } from "./types";

interface DataTableFacetedFilterProps<TData extends RowData, TValue> {
  column?: DataTableColumn<TData, TValue>;
  filterValue?: unknown;
  title?: string;
  options: Option[];
  multiple?: boolean;
}

/** 适用于单选或多选列的分面筛选器；选中值以数组形式写入列筛选状态。 */
export function DataTableFacetedFilter<TData extends RowData, TValue>({ column, filterValue, title, options, multiple }: DataTableFacetedFilterProps<TData, TValue>) {
  const [open, setOpen] = React.useState(false);

  const columnFilterValue = filterValue ?? column?.getFilterValue();
  const selectedValues = new Set(Array.isArray(columnFilterValue) ? columnFilterValue : []);

  const onItemSelect = (option: Option, isSelected: boolean) => {
    if (!column) return;

    if (multiple) {
      const nextSelected = new Set(selectedValues);
      if (isSelected) {
        nextSelected.delete(option.value);
      } else {
        nextSelected.add(option.value);
      }
      const filterValues = Array.from(nextSelected);
      column.setFilterValue(filterValues.length ? filterValues : undefined);
      return;
    }

    column.setFilterValue(isSelected ? undefined : [option.value]);
    setOpen(false);
  };

  const onReset = React.useCallback(
    (event?: React.MouseEvent) => {
      event?.stopPropagation();
      column?.setFilterValue(undefined);
    },
    [column],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="border-dashed font-normal">
          {selectedValues?.size > 0 ? (
            <div
              role="button"
              aria-label={`Clear ${title} filter`}
              tabIndex={0}
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
              onClick={onReset}
            >
              <RiCloseCircleLine />
            </div>
          ) : (
            <RiAddCircleLine />
          )}
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-0.5 data-[orientation=vertical]:h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedValues.size}
              </Badge>
              <div className="hidden items-center gap-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    已选 {selectedValues.size} 项
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge variant="secondary" key={String(option.value)} className="rounded-sm px-1 font-normal">
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-50 p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList className="max-h-full">
            <CommandEmpty>未找到结果</CommandEmpty>
            <CommandGroup className="max-h-75 scroll-py-1 overflow-x-hidden overflow-y-auto">
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);

                return (
                  <CommandItem key={String(option.value)} className="[&>svg:last-child]:hidden" onSelect={() => onItemSelect(option, isSelected)}>
                    <div className={cn("flex size-4 items-center justify-center rounded-sm border border-primary", isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                      <RiCheckLine />
                    </div>
                    {option.icon && <option.icon />}
                    <span className="truncate">{option.label}</span>
                    {option.count && <span className="ml-auto font-mono text-xs">{option.count}</span>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={() => onReset()} className="justify-center text-center">
                    清除筛选
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
