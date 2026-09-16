import { useState } from "react";

export interface UsePaginationOptions {
  total?: number;
  page?: number;
  defaultPage?: number;
  pageSize?: number;
  defaultPageSize?: number;
  onChange?: (page: number, pageSize: number) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (page: number, pageSize: number) => void;
}

export interface UsePaginationResult {
  page: number;
  pageSize: number;
  pageCount: number;
  range: [number, number];
  hasPrevPage: boolean;
  hasNextPage: boolean;
  change: (page: number, pageSize?: number) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPageCount(total: number, pageSize: number) {
  if (total <= 0 || pageSize <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(total / pageSize));
}

function resolvePage(page: number, total: number, pageCount: number) {
  if (total <= 0) {
    return Math.max(page, 1);
  }
  return clamp(page, 1, pageCount);
}

export function usePagination({
  total = 0,
  page: controlledPage,
  defaultPage = 1,
  pageSize: controlledPageSize,
  defaultPageSize = 10,
  onChange,
  onPageChange,
  onPageSizeChange,
}: UsePaginationOptions = {}): UsePaginationResult {
  const isPageControlled = controlledPage !== undefined;
  const isPageSizeControlled = controlledPageSize !== undefined;
  const [pageState, setPageState] = useState(defaultPage);
  const [pageSizeState, setPageSizeState] = useState(defaultPageSize);

  const pageSize = isPageSizeControlled ? controlledPageSize : pageSizeState;
  const pageCount = getPageCount(total, pageSize);
  const unclampedPage = isPageControlled ? controlledPage : pageState;
  const page = resolvePage(unclampedPage, total, pageCount);

  if (!isPageControlled && unclampedPage !== page) {
    setPageState(page);
  }

  function change(nextPage: number, nextPageSize = pageSize) {
    const nextPageCount = getPageCount(total, nextPageSize);
    const next = resolvePage(nextPage, total, nextPageCount);
    const pageSizeChanged = nextPageSize !== pageSize;

    if (!isPageControlled) {
      setPageState(next);
    }
    if (!isPageSizeControlled && pageSizeChanged) {
      setPageSizeState(nextPageSize);
    }

    if (pageSizeChanged) {
      onPageSizeChange?.(next, nextPageSize);
    } else {
      onPageChange?.(next);
    }
    onChange?.(next, nextPageSize);
  }

  function setPage(nextPage: number) {
    change(nextPage, pageSize);
  }

  function setPageSize(nextPageSize: number) {
    const firstItemIndex = (page - 1) * pageSize;
    const nextPage = Math.floor(firstItemIndex / nextPageSize) + 1;
    change(nextPage, nextPageSize);
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return {
    page,
    pageSize,
    pageCount,
    range: [rangeStart, rangeEnd],
    hasPrevPage: page > 1,
    hasNextPage: page < pageCount,
    change,
    setPage,
    setPageSize,
  };
}
