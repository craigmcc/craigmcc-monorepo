"use client";

/**
 * React hook that keeps TanStack filter, sorting, and pagination state in sync with URL params.
 */

// External Imports ----------------------------------------------------------

import {
  applyFilterPatch,
  createUrlSearchParamsIO,
  parseFilters,
  serializeFilters,
  type FilterPatch,
} from "@repo/shared-utils/filters";
import {
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  type Updater,
} from "@tanstack/react-table";
import { useCallback, useMemo, useRef, useState } from "react";

// Internal Imports ----------------------------------------------------------

import {
  fromColumnFiltersState,
  type TanStackFilterAdapterConfig,
  toColumnFiltersState,
} from "./TanStackFilterAdapters";
import {
  parsePaginationState,
  parseSortingState,
  serializePaginationState,
  serializeSortingState,
  type TanStackPaginationConfig,
  type TanStackSortingConfig,
} from "./TanStackStateAdapters";

// Public Objects ------------------------------------------------------------

export type DaisyTableFilterState<TState extends Record<string, unknown>> = {
  columnFilters: ColumnFiltersState;
  filters: TState;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  pagination: PaginationState;
  setFilterPatch: (patch: FilterPatch<TState>) => void;
  setFilters: (updater: Updater<TState>) => void;
  setPagination: OnChangeFn<PaginationState>;
  setSorting: OnChangeFn<SortingState>;
  sorting: SortingState;
};

export type UseDaisyTableFiltersOptions<TState extends Record<string, unknown>> = {
  filterConfig: TanStackFilterAdapterConfig<TState>;
  paginationConfig: TanStackPaginationConfig;
  sortingConfig: TanStackSortingConfig;
  syncToUrl?: boolean;
};

export function useDaisyTableFilters<TState extends Record<string, unknown>>(
  options: UseDaisyTableFiltersOptions<TState>,
): DaisyTableFilterState<TState> {
  const initialState = useMemo(() => {
    const searchParams = getCurrentSearchParams();
    const io = createUrlSearchParamsIO(searchParams);

    return {
      filters: parseFilters(options.filterConfig.schema, io.getParam),
      pagination: parsePaginationState(options.paginationConfig, io.getParam),
      sorting: parseSortingState(options.sortingConfig, io.getParam),
    };
  }, [options.filterConfig.schema, options.paginationConfig, options.sortingConfig]);

  const [filters, setFilters] = useState<TState>(initialState.filters);
  const [pagination, setPaginationState] = useState<PaginationState>(initialState.pagination);
  const [sorting, setSortingState] = useState<SortingState>(initialState.sorting);
  const latestStateRef = useRef(initialState);

  const columnFilters = useMemo(
    () => toColumnFiltersState(options.filterConfig, filters),
    [filters, options.filterConfig],
  );

  const syncUrl = useCallback((next: {
    filters: TState;
    pagination: PaginationState;
    sorting: SortingState;
  }) => {
    if (options.syncToUrl === false || typeof window === "undefined") {
      return;
    }

    const searchParams = getCurrentSearchParams();
    const io = createUrlSearchParamsIO(searchParams);

    serializeFilters(options.filterConfig.schema, next.filters, io.setParam);
    serializeSortingState(options.sortingConfig, next.sorting, io.setParam);
    serializePaginationState(options.paginationConfig, next.pagination, io.setParam);

    const queryString = searchParams.toString();
    const nextUrl = `${window.location.pathname}${queryString.length > 0 ? `?${queryString}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
  }, [options.filterConfig.schema, options.paginationConfig, options.sortingConfig, options.syncToUrl]);

  const setFilterPatch = useCallback((patch: FilterPatch<TState>) => {
    setFilters((current) => {
      const nextFilters = applyFilterPatch(options.filterConfig.schema, current, patch);
      const nextState = {
        filters: nextFilters,
        pagination: latestStateRef.current.pagination,
        sorting: latestStateRef.current.sorting,
      };
      latestStateRef.current = nextState;
      syncUrl(nextState);
      return nextFilters;
    });
  }, [options.filterConfig.schema, syncUrl]);

  const setFiltersWithUpdater = useCallback((updater: Updater<TState>) => {
    setFilters((current) => {
      const updated = applyUpdater(updater, current);
      const nextFilters = applyFilterPatch(options.filterConfig.schema, current, updated);
      const nextState = {
        filters: nextFilters,
        pagination: latestStateRef.current.pagination,
        sorting: latestStateRef.current.sorting,
      };
      latestStateRef.current = nextState;
      syncUrl(nextState);
      return nextFilters;
    });
  }, [options.filterConfig.schema, syncUrl]);

  const setPagination = useCallback<OnChangeFn<PaginationState>>((updater) => {
    setPaginationState((current) => {
      const nextPagination = applyUpdater(updater, current);
      const nextState = {
        filters: latestStateRef.current.filters,
        pagination: nextPagination,
        sorting: latestStateRef.current.sorting,
      };
      latestStateRef.current = nextState;
      syncUrl(nextState);
      return nextPagination;
    });
  }, [syncUrl]);

  const setSorting = useCallback<OnChangeFn<SortingState>>((updater) => {
    setSortingState((current) => {
      const nextSorting = applyUpdater(updater, current);
      const nextState = {
        filters: latestStateRef.current.filters,
        pagination: latestStateRef.current.pagination,
        sorting: nextSorting,
      };
      latestStateRef.current = nextState;
      syncUrl(nextState);
      return nextSorting;
    });
  }, [syncUrl]);

  const onColumnFiltersChange = useCallback<OnChangeFn<ColumnFiltersState>>((updater) => {
    setFilters((current) => {
      const currentColumnFilters = toColumnFiltersState(options.filterConfig, current);
      const nextColumnFilters = applyUpdater(updater, currentColumnFilters);
      const nextFilters = fromColumnFiltersState(options.filterConfig, nextColumnFilters);
      const nextState = {
        filters: nextFilters,
        pagination: latestStateRef.current.pagination,
        sorting: latestStateRef.current.sorting,
      };
      latestStateRef.current = nextState;
      syncUrl(nextState);
      return nextFilters;
    });
  }, [options.filterConfig, syncUrl]);

  return {
    columnFilters,
    filters,
    onColumnFiltersChange,
    pagination,
    setFilterPatch,
    setFilters: setFiltersWithUpdater,
    setPagination,
    setSorting,
    sorting,
  };
}

// Private Objects -----------------------------------------------------------

function applyUpdater<TState>(updater: Updater<TState>, current: TState): TState {
  return typeof updater === "function"
    ? (updater as (previous: TState) => TState)(current)
    : updater;
}

function getCurrentSearchParams(): URLSearchParams {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }
  return new URLSearchParams(window.location.search);
}

