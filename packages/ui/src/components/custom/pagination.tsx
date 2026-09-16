import { useId, useState, type KeyboardEvent, type ReactNode, type SubmitEvent } from "react";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowLeftDoubleLine,
  RiArrowRightDoubleLine,
  RiMoreFill,
} from "@remixicon/react";

import { Button } from "@workspace/ui/components/shadcn/button";
import { Input } from "@workspace/ui/components/shadcn/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/shadcn/select";
import { usePagination } from "@workspace/ui/hooks/use-pagination";
import { cn } from "@workspace/ui/lib/utils";

export type PaginationAlign = "start" | "center" | "end";
export type PaginationSize = "large" | "medium" | "small";
export type PaginationItemType = "page" | "prev" | "next" | "jump-prev" | "jump-next";

type PageToken = number | "jump-prev" | "jump-next";

export interface PaginationProps {
  total?: number;
  current?: number;
  defaultCurrent?: number;
  pageSize?: number;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  disabled?: boolean;
  hideOnSinglePage?: boolean;
  showLessItems?: boolean;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean | { goButton?: ReactNode };
  showTitle?: boolean;
  showTotal?: (total: number, range: [number, number]) => ReactNode;
  simple?: boolean | { readOnly?: boolean };
  size?: PaginationSize;
  align?: PaginationAlign;
  totalBoundaryShowSizeChanger?: number;
  className?: string;
  itemRender?: (page: number, type: PaginationItemType, originalElement: ReactNode) => ReactNode;
  onChange?: (page: number, pageSize: number) => void;
  onShowSizeChange?: (current: number, size: number) => void;
}

const alignClass: Record<PaginationAlign, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
};

/** 参考 rc-pagination / Ant Design 的页码折叠算法 */
function getPageTokens(current: number, totalPages: number, showLessItems: boolean): PageToken[] {
  if (totalPages <= 0) {
    return [];
  }

  const siblingCount = showLessItems ? 1 : 2;
  const totalNumbers = siblingCount * 2 + 5;

  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const leftSibling = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, totalPages);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftItemCount = siblingCount * 2 + 3;
    return [...Array.from({ length: leftItemCount }, (_, index) => index + 1), "jump-next", totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightItemCount = siblingCount * 2 + 3;
    const start = totalPages - rightItemCount + 1;
    return [1, "jump-prev", ...Array.from({ length: rightItemCount }, (_, index) => start + index)];
  }

  return [1, "jump-prev", ...Array.from({ length: rightSibling - leftSibling + 1 }, (_, index) => leftSibling + index), "jump-next", totalPages];
}

function Pagination({
  total = 0,
  current,
  defaultCurrent = 1,
  pageSize,
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  disabled = false,
  hideOnSinglePage = false,
  showLessItems = false,
  showSizeChanger,
  showQuickJumper = false,
  showTitle = true,
  showTotal,
  simple = false,
  size = "medium",
  align = "end",
  totalBoundaryShowSizeChanger = 50,
  className,
  itemRender,
  onChange,
  onShowSizeChange,
}: PaginationProps) {
  const jumperId = useId();
  const {
    page,
    pageSize: resolvedPageSize,
    pageCount,
    range: [rangeStart, rangeEnd],
    hasPrevPage,
    hasNextPage,
    change,
    setPage,
    setPageSize,
  } = usePagination({
    total,
    page: current,
    defaultPage: defaultCurrent,
    pageSize,
    defaultPageSize,
    onChange,
    onPageSizeChange: onShowSizeChange,
  });
  const [jumperValue, setJumperValue] = useState("");
  const [simpleValue, setSimpleValue] = useState("");
  const jumpStep = showLessItems ? 3 : 5;

  const shouldShowSizeChanger = showSizeChanger ?? total > totalBoundaryShowSizeChanger;

  const isSimple = Boolean(simple);
  const simpleReadOnly = typeof simple === "object" ? Boolean(simple.readOnly) : false;

  const iconSize = size === "large" ? "icon-lg" : size === "small" ? "icon-xs" : "icon-sm";
  const controlHeightClass = size === "large" ? "h-10 text-sm" : size === "small" ? "h-6 text-xs" : "h-8 text-sm";
  const selectSize = size === "large" ? "default" : "sm";

  const [simpleSource, setSimpleSource] = useState(page);
  if (simpleSource !== page) {
    setSimpleSource(page);
    setSimpleValue(String(page));
  }

  if (hideOnSinglePage && pageCount <= 1) {
    return null;
  }

  function handleJumpEllipsis(direction: "jump-prev" | "jump-next") {
    change(page + (direction === "jump-prev" ? -jumpStep : jumpStep));
  }

  function submitQuickJump(event?: SubmitEvent<HTMLFormElement>) {
    event?.preventDefault();
    const nextPage = Number.parseInt(jumperValue, 10);
    if (Number.isFinite(nextPage)) {
      change(nextPage);
      setJumperValue("");
    }
  }

  function submitSimpleJump() {
    const nextPage = Number.parseInt(simpleValue, 10);
    if (Number.isFinite(nextPage)) {
      change(nextPage);
    } else {
      setSimpleValue(String(page));
    }
  }

  function renderItem(page: number, type: PaginationItemType, node: ReactNode) {
    return itemRender ? itemRender(page, type, node) : node;
  }

  const prevNode = (
    <Button
      type="button"
      variant="ghost"
      size={iconSize}
      disabled={disabled || !hasPrevPage}
      aria-label="上一页"
      title={showTitle ? "上一页" : undefined}
      data-slot="pagination-previous"
      onClick={() => setPage(page - 1)}
    >
      <RiArrowLeftSLine />
    </Button>
  );

  const nextNode = (
    <Button
      type="button"
      variant="ghost"
      size={iconSize}
      disabled={disabled || !hasNextPage}
      aria-label="下一页"
      title={showTitle ? "下一页" : undefined}
      data-slot="pagination-next"
      onClick={() => setPage(page + 1)}
    >
      <RiArrowRightSLine />
    </Button>
  );

  const totalNode = showTotal ? (
    <span data-slot="pagination-total" className="mr-1 text-sm text-muted-foreground">
      {showTotal(total, [rangeStart, rangeEnd])}
    </span>
  ) : null;

  if (isSimple) {
    return (
      <nav
        role="navigation"
        aria-label="分页"
        data-slot="pagination"
        data-simple=""
        className={cn("flex flex-wrap items-center gap-2", alignClass[align], disabled && "pointer-events-none opacity-50", className)}
      >
        {totalNode}
        {renderItem(page - 1, "prev", prevNode)}
        <span className={cn("inline-flex items-center gap-1 text-muted-foreground", controlHeightClass)}>
          {simpleReadOnly ? (
            <span className="min-w-6 text-center font-medium text-foreground tabular-nums">{page}</span>
          ) : (
            <Input
              type="text"
              inputMode="numeric"
              disabled={disabled}
              value={simpleValue}
              aria-label="页码"
              data-slot="pagination-jumper"
              onChange={event => setSimpleValue(event.target.value)}
              onBlur={submitSimpleJump}
              onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitSimpleJump();
                }
              }}
              className={cn("w-10 px-1 text-center tabular-nums", controlHeightClass)}
            />
          )}
          <span>/</span>
          <span className="text-foreground tabular-nums">{pageCount}</span>
        </span>
        {renderItem(page + 1, "next", nextNode)}
      </nav>
    );
  }

  const tokens = getPageTokens(page, pageCount, showLessItems);
  const goButton = typeof showQuickJumper === "object" ? showQuickJumper.goButton : undefined;

  return (
    <nav
      role="navigation"
      aria-label="分页"
      data-slot="pagination"
      className={cn("flex flex-wrap items-center gap-2", alignClass[align], disabled && "pointer-events-none opacity-50", className)}
    >
      {totalNode}
      {renderItem(page - 1, "prev", prevNode)}

      {tokens.map(token => {
        if (token === "jump-prev" || token === "jump-next") {
          const isPrev = token === "jump-prev";
          const label = isPrev ? `向前 ${jumpStep} 页` : `向后 ${jumpStep} 页`;
          const node = (
            <Button
              type="button"
              variant="ghost"
              size={iconSize}
              disabled={disabled}
              aria-label={label}
              title={showTitle ? label : undefined}
              data-slot="pagination-ellipsis"
              className="group"
              onClick={() => handleJumpEllipsis(token)}
            >
              <RiMoreFill className="group-hover:hidden group-focus-visible:hidden" />
              {isPrev ? (
                <RiArrowLeftDoubleLine className="hidden group-hover:block group-focus-visible:block" />
              ) : (
                <RiArrowRightDoubleLine className="hidden group-hover:block group-focus-visible:block" />
              )}
            </Button>
          );

          return <span key={token}>{renderItem(isPrev ? Math.max(1, page - jumpStep) : Math.min(pageCount, page + jumpStep), token, node)}</span>;
        }

        const active = token === page;
        const node = (
          <Button
            type="button"
            variant={active ? "outline" : "ghost"}
            size={iconSize}
            disabled={disabled}
            aria-label={`第 ${token} 页`}
            aria-current={active ? "page" : undefined}
            title={showTitle ? `第 ${token} 页` : undefined}
            data-slot="pagination-item"
            data-active={active}
            onClick={() => setPage(token)}
          >
            {token}
          </Button>
        );

        return <span key={token}>{renderItem(token, "page", node)}</span>;
      })}

      {renderItem(page + 1, "next", nextNode)}

      {shouldShowSizeChanger ? (
        <Select
          disabled={disabled}
          value={String(resolvedPageSize)}
          onValueChange={value => {
            setPageSize(Number(value));
          }}
        >
          <SelectTrigger size={selectSize} aria-label="每页条数" data-slot="pagination-size" className={cn("min-w-26", size === "small" && "h-6 text-xs")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map(option => (
              <SelectItem key={option} value={String(option)}>
                {`${option} 条/页`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {showQuickJumper ? (
        <form className={cn("inline-flex items-center gap-1.5 text-sm text-muted-foreground", controlHeightClass)} onSubmit={submitQuickJump}>
          <label htmlFor={jumperId} className="whitespace-nowrap">
            跳至
          </label>
          <Input
            id={jumperId}
            type="text"
            inputMode="numeric"
            disabled={disabled}
            value={jumperValue}
            aria-label="跳至页码"
            data-slot="pagination-jumper"
            onChange={event => setJumperValue(event.target.value)}
            onBlur={() => {
              if (jumperValue.trim()) {
                submitQuickJump();
              }
            }}
            className={cn("w-12 px-1 text-center tabular-nums", controlHeightClass)}
          />
          <span>页</span>
          {goButton ? (
            typeof goButton === "string" || typeof goButton === "number" ? (
              <Button variant="secondary" size={size === "large" ? "default" : "sm"} type="submit" disabled={disabled}>
                {goButton}
              </Button>
            ) : (
              goButton
            )
          ) : null}
        </form>
      ) : null}
    </nav>
  );
}

export { Pagination };
