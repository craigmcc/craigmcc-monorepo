/**
 * TanStack state adapters for sorting and pagination URL synchronization.
 */

// External Imports ----------------------------------------------------------

import type { PaginationState, SortingState } from "@tanstack/react-table";

// Internal Imports ----------------------------------------------------------

// Public Objects ------------------------------------------------------------

export type TanStackPaginationConfig = {
  defaultValue: PaginationState;
  maxPageSize?: number;
  minPageSize?: number;
  pageIndexQueryKey?: string;
  pageSizeQueryKey?: string;
};

export type TanStackSortingConfig = {
  defaultValue: SortingState;
  queryKey?: string;
};

export function parsePaginationState(
  config: TanStackPaginationConfig,
  getParam: (queryKey: string) => string | null,
): PaginationState {
  const pageIndexQueryKey = config.pageIndexQueryKey ?? "page";
  const pageSizeQueryKey = config.pageSizeQueryKey ?? "pageSize";
  const rawPageIndex = parseInteger(getParam(pageIndexQueryKey));
  const rawPageSize = parseInteger(getParam(pageSizeQueryKey));

  const pageIndex = rawPageIndex === undefined
    ? config.defaultValue.pageIndex
    : Math.max(0, rawPageIndex);

  let pageSize = rawPageSize === undefined
    ? config.defaultValue.pageSize
    : Math.max(1, rawPageSize);

  if (config.minPageSize !== undefined) {
    pageSize = Math.max(config.minPageSize, pageSize);
  }
  if (config.maxPageSize !== undefined) {
    pageSize = Math.min(config.maxPageSize, pageSize);
  }

  return {
    pageIndex,
    pageSize,
  };
}

export function parseSortingState(
  config: TanStackSortingConfig,
  getParam: (queryKey: string) => string | null,
): SortingState {
  const queryKey = config.queryKey ?? "sort";
  const rawValue = getParam(queryKey);
  if (!rawValue) {
    return config.defaultValue;
  }

  const sortingEntries = rawValue
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map(parseSortingEntry)
    .filter((entry): entry is { desc: boolean; id: string } => entry !== undefined);

  return sortingEntries.length > 0 ? sortingEntries : config.defaultValue;
}

export function serializePaginationState(
  config: TanStackPaginationConfig,
  pagination: PaginationState,
  setParam: (queryKey: string, value: string | null) => void,
): void {
  const pageIndexQueryKey = config.pageIndexQueryKey ?? "page";
  const pageSizeQueryKey = config.pageSizeQueryKey ?? "pageSize";

  if (pagination.pageIndex === config.defaultValue.pageIndex) {
    setParam(pageIndexQueryKey, null);
  } else {
    setParam(pageIndexQueryKey, String(pagination.pageIndex));
  }

  if (pagination.pageSize === config.defaultValue.pageSize) {
    setParam(pageSizeQueryKey, null);
  } else {
    setParam(pageSizeQueryKey, String(pagination.pageSize));
  }
}

export function serializeSortingState(
  config: TanStackSortingConfig,
  sorting: SortingState,
  setParam: (queryKey: string, value: string | null) => void,
): void {
  const queryKey = config.queryKey ?? "sort";

  if (equalsSortingState(sorting, config.defaultValue)) {
    setParam(queryKey, null);
    return;
  }

  const encodedValue = sorting
    .map((entry) => `${entry.id}:${entry.desc ? "desc" : "asc"}`)
    .join(",");

  setParam(queryKey, encodedValue.length > 0 ? encodedValue : null);
}

// Private Objects -----------------------------------------------------------

function equalsSortingState(left: SortingState, right: SortingState): boolean {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index]?.id !== right[index]?.id || left[index]?.desc !== right[index]?.desc) {
      return false;
    }
  }

  return true;
}

function parseInteger(rawValue: string | null): number | undefined {
  if (!rawValue || !/^-?\d+$/.test(rawValue)) {
    return undefined;
  }

  return Number.parseInt(rawValue, 10);
}

function parseSortingEntry(
  rawEntry: string,
): { desc: boolean; id: string } | undefined {
  const separatorIndex = rawEntry.indexOf(":");
  if (separatorIndex <= 0 || separatorIndex >= rawEntry.length - 1) {
    return undefined;
  }

  const id = rawEntry.substring(0, separatorIndex);
  const direction = rawEntry.substring(separatorIndex + 1);
  if (direction !== "asc" && direction !== "desc") {
    return undefined;
  }

  return {
    desc: direction === "desc",
    id,
  };
}

