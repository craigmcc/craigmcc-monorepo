/**
 * TanStack Table adapters that map shared filter schema values to column filters.
 */

// External Imports ----------------------------------------------------------

import {
  applyFilterPatch,
  getDefaultFilters,
  type FilterSchema,
} from "@repo/shared-utils/filters";
import type { ColumnFiltersState } from "@tanstack/react-table";

// Internal Imports ----------------------------------------------------------

// Public Objects ------------------------------------------------------------

export function fromColumnFiltersState<TState extends Record<string, unknown>>(
  config: TanStackFilterAdapterConfig<TState>,
  columnFilters: ColumnFiltersState,
): TState {
  const defaults = getDefaultFilters(config.schema);
  const patch: Partial<TState> = {};

  for (const adapter of config.adapters) {
    const columnFilter = columnFilters.find((entry) => entry.id === adapter.columnId);
    if (!columnFilter) {
      continue;
    }

    const parsedValue = adapter.fromColumnValue
      ? adapter.fromColumnValue(columnFilter.value)
      : (columnFilter.value as TState[typeof adapter.key]);

    if (parsedValue === undefined) {
      continue;
    }

    patch[adapter.key] = parsedValue;
  }

  return applyFilterPatch(config.schema, defaults, patch);
}

export type TanStackColumnFilterAdapter<
  TState extends Record<string, unknown>,
  TKey extends keyof TState,
> = {
  columnId: string;
  fromColumnValue?: (columnValue: unknown) => TState[TKey] | undefined;
  isActive?: (value: TState[TKey], defaultValue: TState[TKey]) => boolean;
  key: TKey;
  toColumnValue?: (value: TState[TKey]) => unknown;
};

export type TanStackFilterAdapterConfig<TState extends Record<string, unknown>> = {
  adapters: Array<TanStackColumnFilterAdapter<TState, keyof TState>>;
  schema: FilterSchema<TState>;
};

export function toColumnFiltersState<TState extends Record<string, unknown>>(
  config: TanStackFilterAdapterConfig<TState>,
  state: TState,
): ColumnFiltersState {
  const defaultsByKey = createDefaultsByKey(config.schema);
  const columnFilters: ColumnFiltersState = [];

  for (const adapter of config.adapters) {
    const value = state[adapter.key] as TState[typeof adapter.key];
    const defaultValue = defaultsByKey[adapter.key] as TState[typeof adapter.key];
    const isActive = adapter.isActive
      ? adapter.isActive(value, defaultValue)
      : !Object.is(value, defaultValue);

    if (!isActive) {
      continue;
    }

    columnFilters.push({
      id: adapter.columnId,
      value: adapter.toColumnValue ? adapter.toColumnValue(value) : value,
    });
  }

  return columnFilters;
}

// Private Objects -----------------------------------------------------------

function createDefaultsByKey<TState extends Record<string, unknown>>(
  schema: FilterSchema<TState>,
): Partial<Record<keyof TState, unknown>> {
  const defaultsByKey: Partial<Record<keyof TState, unknown>> = {};

  for (const field of schema.fields) {
    defaultsByKey[field.key] = field.defaultValue;
  }

  return defaultsByKey;
}

