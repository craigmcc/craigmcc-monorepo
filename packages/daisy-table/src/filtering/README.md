# TanStack Filtering Kit

This folder contains the TanStack-specific side of the hybrid filtering split.

## Design Boundaries

- Generic parsing, patching, codecs, and URL serialization belong in `@repo/shared-utils/filters`.
- TanStack table mapping and table state orchestration belong in `@repo/daisy-table/filtering`.

## Primary APIs

- `fromColumnFiltersState(config, columnFilters)` converts `ColumnFiltersState` into schema-based filter state.
- `toColumnFiltersState(config, state)` converts schema-based filter state into `ColumnFiltersState`.
- `parseSortingState(config, getParam)` and `serializeSortingState(config, sorting, setParam)` handle sorting URL state.
- `parsePaginationState(config, getParam)` and `serializePaginationState(config, pagination, setParam)` handle pagination URL state.
- `useDaisyTableFilters(options)` manages filters, sorting, pagination, TanStack callbacks, and URL synchronization.

## Typical Usage

1. Define a shared `FilterSchema` in app code.
2. Define table adapters that map schema keys to TanStack column ids.
3. Call `useDaisyTableFilters` to hydrate from URL and get controlled table state.
4. Pass `columnFilters`, `sorting`, and `pagination` into `useReactTable`.
5. Bind input controls with `setFilterPatch` (or `setFilters`) and wire TanStack callbacks.

## Migration Checklist

- Move URL/query parsing to `@repo/shared-utils/filters`.
- Keep `ColumnFiltersState` translation in this `daisy-table` package.
- Use `useDaisyTableFilters` as the default orchestration path.
- Add tests for defaults, invalid values, active/inactive filter mapping, and round-trips.

## Cross-Repo Migration Playbook

Use this when adopting the same pattern in another app or repository.

### 1) Define filter schema (app-specific fields)

```ts
import { stringCodec, type FilterSchema } from "@repo/shared-utils/filters";

type UserFilters = {
  email: string;
  name: string;
  phone: string;
};

const USER_FILTER_SCHEMA: FilterSchema<UserFilters> = {
  fields: [
    { codec: stringCodec(), defaultValue: "", key: "email", queryKey: "email" },
    { codec: stringCodec(), defaultValue: "", key: "name", queryKey: "name" },
    { codec: stringCodec(), defaultValue: "", key: "phone", queryKey: "phone" },
  ],
};
```

### 2) Define TanStack column adapter mapping

```ts
import { type TanStackFilterAdapterConfig } from "@repo/daisy-table/filtering";

const USER_FILTER_ADAPTER_CONFIG: TanStackFilterAdapterConfig<UserFilters> = {
  adapters: [
    { columnId: "email", key: "email" },
    { columnId: "name", key: "name" },
    { columnId: "phone", key: "phone" },
  ],
  schema: USER_FILTER_SCHEMA,
};
```

### 3) Wire the hook into your table component

```tsx
const {
  columnFilters,
  filters,
  onColumnFiltersChange,
  pagination,
  setFilterPatch,
  setPagination,
  setSorting,
  sorting,
} = useDaisyTableFilters({
  filterConfig: USER_FILTER_ADAPTER_CONFIG,
  paginationConfig: { defaultValue: { pageIndex: 0, pageSize: 25 } },
  sortingConfig: { defaultValue: [{ desc: false, id: "id" }] },
});

const table = useReactTable({
  columns,
  data,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  onColumnFiltersChange,
  onPaginationChange: setPagination,
  onSortingChange: setSorting,
  state: { columnFilters, pagination, sorting },
});

<Input value={filters.name} handleChange={(value) => setFilterPatch({ name: value })} />
```

### 4) Validate behavior before rollout

- Empty URL -> defaults are applied.
- Invalid URL values -> defaults are applied.
- Changing inputs updates URL query params.
- Sorting + pagination are preserved in URL.
- Reload/back/forward rehydrates table state from URL.

### 5) Test matrix to copy between repos

- parse defaults
- parse invalid values
- serialize omits defaults
- filter patch normalization
- column filter mapping in/out
- sorting parse/serialize
- pagination parse/serialize
- URL round-trip consistency

## Practical Notes

- Keep schema and adapters near the table page/component where business fields are known.
- Keep reusable codec and parsing logic in shared utilities.
- Prefer omitting default values from URL for cleaner links and stable snapshots.

## Starter Template (Sorting + Pagination Included)

Use this when you want one copy/paste block that handles filters, sorting, and pagination together.

### `src/table-filters/tableState.ts`

```ts
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";

import { parseFilters, serializeFilters } from "./filterSchema";
import {
  fromColumnFiltersState,
  toColumnFiltersState,
  type TanStackAdapter,
} from "./tanstackAdapters";
import type { FilterSchema } from "./filterTypes";

export type TableStateConfig<TState extends Record<string, unknown>> = {
  adapters: Array<TanStackAdapter<TState, keyof TState>>;
  filterSchema: FilterSchema<TState>;
  paginationDefault: PaginationState;
  sortingDefault: SortingState;
};

export function parseTableState<TState extends Record<string, unknown>>(
  config: TableStateConfig<TState>,
  searchParams: URLSearchParams,
): {
  filters: TState;
  pagination: PaginationState;
  sorting: SortingState;
} {
  const filters = parseFilters(config.filterSchema, (queryKey) => searchParams.get(queryKey));

  const page = parseInteger(searchParams.get("page"));
  const pageSize = parseInteger(searchParams.get("pageSize"));
  const sort = parseSorting(searchParams.get("sort"));

  return {
    filters,
    pagination: {
      pageIndex: page ?? config.paginationDefault.pageIndex,
      pageSize: pageSize ?? config.paginationDefault.pageSize,
    },
    sorting: sort.length > 0 ? sort : config.sortingDefault,
  };
}

export function serializeTableState<TState extends Record<string, unknown>>(
  config: TableStateConfig<TState>,
  state: {
    filters: TState;
    pagination: PaginationState;
    sorting: SortingState;
  },
  searchParams: URLSearchParams,
): URLSearchParams {
  const nextParams = new URLSearchParams(searchParams);

  serializeFilters(config.filterSchema, state.filters, (queryKey, value) => {
    if (value === null) {
      nextParams.delete(queryKey);
      return;
    }
    nextParams.set(queryKey, value);
  });

  if (state.pagination.pageIndex === config.paginationDefault.pageIndex) {
    nextParams.delete("page");
  } else {
    nextParams.set("page", String(state.pagination.pageIndex));
  }

  if (state.pagination.pageSize === config.paginationDefault.pageSize) {
    nextParams.delete("pageSize");
  } else {
    nextParams.set("pageSize", String(state.pagination.pageSize));
  }

  if (isSameSorting(state.sorting, config.sortingDefault)) {
    nextParams.delete("sort");
  } else {
    const encodedSort = state.sorting
      .map((entry) => `${entry.id}:${entry.desc ? "desc" : "asc"}`)
      .join(",");
    if (encodedSort.length === 0) {
      nextParams.delete("sort");
    } else {
      nextParams.set("sort", encodedSort);
    }
  }

  return nextParams;
}

export function toTanStackState<TState extends Record<string, unknown>>(
  config: TableStateConfig<TState>,
  filters: TState,
): ColumnFiltersState {
  return toColumnFiltersState(config.adapters, filters);
}

export function updateFiltersFromTanStack<TState extends Record<string, unknown>>(
  config: TableStateConfig<TState>,
  columnFilters: ColumnFiltersState,
): TState {
  return fromColumnFiltersState(config.adapters, config.filterSchema, columnFilters);
}

function isSameSorting(left: SortingState, right: SortingState): boolean {
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

function parseInteger(value: string | null): number | undefined {
  if (!value || !/^-?\d+$/.test(value)) {
    return undefined;
  }

  return Number.parseInt(value, 10);
}

function parseSorting(value: string | null): SortingState {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const [id, direction] = entry.split(":");
      if (!id || (direction !== "asc" && direction !== "desc")) {
        return undefined;
      }
      return { desc: direction === "desc", id };
    })
    .filter((entry): entry is { desc: boolean; id: string } => entry !== undefined);
}
```

### `src/table-filters/tanstackAdapters.ts` (replace prior minimal one)

```ts
import type { ColumnFiltersState } from "@tanstack/react-table";

import { parseFilters } from "./filterSchema";
import type { FilterSchema } from "./filterTypes";

export type TanStackAdapter<TState extends Record<string, unknown>, TKey extends keyof TState> = {
  columnId: string;
  key: TKey;
};

export function fromColumnFiltersState<TState extends Record<string, unknown>>(
  adapters: Array<TanStackAdapter<TState, keyof TState>>,
  schema: FilterSchema<TState>,
  columnFilters: ColumnFiltersState,
): TState {
  const params = new URLSearchParams();

  for (const adapter of adapters) {
    const columnFilter = columnFilters.find((entry) => entry.id === adapter.columnId);
    if (!columnFilter) {
      continue;
    }

    if (typeof columnFilter.value === "string") {
      params.set(String(adapter.key), columnFilter.value);
    }
  }

  return parseFilters(schema, (queryKey) => {
    const mapped = adapters.find((adapter) => String(adapter.key) === queryKey);
    if (!mapped) {
      return null;
    }
    return params.get(String(mapped.key));
  });
}

export function toColumnFiltersState<TState extends Record<string, unknown>>(
  adapters: Array<TanStackAdapter<TState, keyof TState>>,
  state: TState,
): ColumnFiltersState {
  return adapters
    .map((adapter) => {
      const value = state[adapter.key];
      return typeof value === "string" && value.length > 0
        ? { id: adapter.columnId, value }
        : undefined;
    })
    .filter((value): value is { id: string; value: unknown } => value !== undefined);
}
```

### `src/table-filters/useTableFilters.ts` (full state)

```tsx
import type {
  OnChangeFn,
  PaginationState,
  SortingState,
  Updater,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import {
  parseTableState,
  serializeTableState,
  toTanStackState,
  updateFiltersFromTanStack,
  type TableStateConfig,
} from "./tableState";

export function useTableFilters<TState extends Record<string, unknown>>(
  config: TableStateConfig<TState>,
) {
  const initial = useMemo(
    () => parseTableState(config, new URLSearchParams(window.location.search)),
    [config],
  );

  const [filters, setFilters] = useState<TState>(initial.filters);
  const [pagination, setPaginationState] = useState<PaginationState>(initial.pagination);
  const [sorting, setSortingState] = useState<SortingState>(initial.sorting);

  const columnFilters = useMemo(
    () => toTanStackState(config, filters),
    [config, filters],
  );

  const syncUrl = (next: {
    filters: TState;
    pagination: PaginationState;
    sorting: SortingState;
  }) => {
    const nextParams = serializeTableState(
      config,
      next,
      new URLSearchParams(window.location.search),
    );
    const queryString = nextParams.toString();
    const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  };

  const onColumnFiltersChange: OnChangeFn<Array<{ id: string; value: unknown }>> = (updater) => {
    setFilters((current) => {
      const currentColumnFilters = toTanStackState(config, current);
      const nextColumnFilters = applyUpdater(updater, currentColumnFilters);
      const nextFilters = updateFiltersFromTanStack(config, nextColumnFilters);
      syncUrl({ filters: nextFilters, pagination, sorting });
      return nextFilters;
    });
  };

  const setFilterPatch = (patch: Partial<TState>) => {
    setFilters((current) => {
      const nextFilters = { ...current, ...patch };
      syncUrl({ filters: nextFilters, pagination, sorting });
      return nextFilters;
    });
  };

  const setPagination: OnChangeFn<PaginationState> = (updater) => {
    setPaginationState((current) => {
      const nextPagination = applyUpdater(updater, current);
      syncUrl({ filters, pagination: nextPagination, sorting });
      return nextPagination;
    });
  };

  const setSorting: OnChangeFn<SortingState> = (updater) => {
    setSortingState((current) => {
      const nextSorting = applyUpdater(updater, current);
      syncUrl({ filters, pagination, sorting: nextSorting });
      return nextSorting;
    });
  };

  return {
    columnFilters,
    filters,
    onColumnFiltersChange,
    pagination,
    setFilterPatch,
    setPagination,
    setSorting,
    sorting,
  };
}

function applyUpdater<TState>(updater: Updater<TState>, current: TState): TState {
  return typeof updater === "function"
    ? (updater as (previous: TState) => TState)(current)
    : updater;
}
```

### Full integration shape

```tsx
const {
  columnFilters,
  filters,
  onColumnFiltersChange,
  pagination,
  setFilterPatch,
  setPagination,
  setSorting,
  sorting,
} = useTableFilters(TABLE_STATE_CONFIG);

const table = useReactTable({
  columns,
  data,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  onColumnFiltersChange,
  onPaginationChange: setPagination,
  onSortingChange: setSorting,
  state: {
    columnFilters,
    pagination,
    sorting,
  },
});

<Input
  label="Filter by Name"
  value={filters.name}
  handleChange={(name) => setFilterPatch({ name })}
/>
```

## Monorepo vs Non-Monorepo Setup

These setups are the same conceptually, but imports and package wiring differ.

### A) Existing monorepo (preferred)

- Keep generic pieces in one shared package (like `shared-utils`).
- Keep TanStack adapters/hook in one table package (like `daisy-table`).
- Apps import from package entry points only.
- Ensure workspace linking is configured (`pnpm-workspace.yaml`, turbo/pnpm setup, etc.).

Typical imports:

```ts
import { stringCodec } from "@repo/shared-utils/filters";
import { useDaisyTableFilters } from "@repo/daisy-table/filtering";
```

### B) Different monorepo without these packages

- Create two local packages if possible (`shared-utils` + `table-kit`) and mirror the split.
- If package creation is heavy, copy starter files into one shared app package first, then extract later.
- Keep the same API names so migration is mostly search/replace.

### C) Standalone repo (non-monorepo)

- Copy starter files into `src/table-filters/*`.
- Use relative imports (`./filterSchema`, `./tableState`, etc.).
- If multiple apps consume it, publish a small internal package later.

### Quick decision guide

- `Multiple apps in same repo now` -> create/extend shared workspace packages.
- `Single app now, possible reuse later` -> local `src/table-filters` first, extract when second consumer appears.
- `Urgent migration with minimal churn` -> copy starter template directly, keep API names stable, refactor to package later.

### Validation commands (adapt per repo)

```bash
pnpm test:ci
pnpm lint
pnpm check-types
```

If your repo does not expose `check-types`, run your local TypeScript check command equivalent.

## Migration Worksheet Template

Copy this section into your tracking doc (or keep it here) and update one row per app.

### Rollout Tracker

| App | Repo Type | Setup Path | Owner | Target Date | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| example-web | Monorepo | Shared packages | @you | 2026-06-07 | Planned | Waiting on API contract review |
| example-admin | Standalone | Local `src/table-filters` | @you | 2026-06-10 | In Progress | Hook wired; tests pending |
| example-shop | Other monorepo | Local first, extract later | @you | 2026-06-14 | Not Started | Needs package boundary decision |

Status values you can reuse:

- `Not Started`
- `Planned`
- `In Progress`
- `Blocked`
- `In Review`
- `Done`

### Per-App Checklist

Use one checklist block per app:

```md
#### <app-name>
- [ ] Choose setup path (`Shared packages` | `Local src/table-filters` | `Local then extract`)
- [ ] Define filter schema (defaults, query keys, normalization)
- [ ] Define TanStack adapter mapping (schema key <-> column id)
- [ ] Wire hook/state into table (`columnFilters`, `sorting`, `pagination`)
- [ ] Sync URL state (parse + serialize)
- [ ] Verify behavior: empty URL, invalid params, reload/back/forward
- [ ] Add/port tests: filter parse/serialize + sorting + pagination + round-trip
- [ ] Run CI checks (`test:ci`, lint, type-check)
- [ ] Ship + monitor
```

### Suggested Rollout Order

1. Migrate one low-risk app first and treat it as the baseline template.
2. Migrate apps in the same repo next (highest reuse, lowest setup churn).
3. Migrate standalone apps last (more local wiring differences).
4. After second successful migration, extract any duplicated local helpers into a shared package.

### Risk/Blocker Log (Optional)

| Date | App | Risk/Blocker | Mitigation | Owner | Resolved |
| --- | --- | --- | --- | --- | --- |
| 2026-06-01 | example-admin | Router search param API differs | Add local adapter wrapper | @you | No |
| 2026-06-03 | example-shop | No shared package scaffold | Start local; extract in phase 2 | @you | No |
