# Date Range Filtering Pattern (From/To)

## Overview

This pattern shows how to implement "from" and "to" limits on a single field (e.g., date ranges) using the separate schema fields approach.

### Key Idea

- **Schema**: Define two independent filter fields (`dateFrom`, `dateTo`)
- **Filtering**: The column's `filterFn` reads directly from the schema-managed `filters` object
- **URL**: Clean, separate params like `?dateFrom=2025-01-01&dateTo=2025-12-31`
- **No adapters needed**: Since we're not using TanStack column filters, we use an empty adapters array

---

## Architecture

### 1. Define the Filter Schema

```ts
type DateRangeFilters = {
  dateFrom: string;  // ISO date string or empty
  dateTo: string;    // ISO date string or empty
};

const DATE_RANGE_SCHEMA: FilterSchema<DateRangeFilters> = {
  fields: [
    {
      codec: stringCodec(),
      defaultValue: "",
      key: "dateFrom",
      queryKey: "dateFrom",
    },
    {
      codec: stringCodec(),
      defaultValue: "",
      key: "dateTo",
      queryKey: "dateTo",
    },
  ],
};
```

**Why two fields?**
- Separate URL parameters make filtering state explicit and shareable
- Each bound can be set independently
- Easy to serialize/deserialize

### 2. Create the Adapter Config (Empty)

```ts
const ADAPTER_CONFIG: TanStackFilterAdapterConfig<DateRangeFilters> = {
  adapters: [],  // Empty—filtering handled by column filterFn, not TanStack column filters
  schema: DATE_RANGE_SCHEMA,
};
```

**Key insight**: In this pattern, we don't use TanStack's column filter mechanism. Instead:
- The schema fields manage state and URL serialization
- The column's `filterFn` reads directly from the parent component's `filters` object
- This avoids the complexity of multiplexing multiple schema fields to a single column ID

### 3. Add Custom Column Filter

```tsx
columnHelper.accessor("createdAt", {
  header: "Created Date",
  enableSorting: true,
  filterFn: (row, _columnId) => {
    const createdAt = row.getValue<Date>("createdAt");
    // Read the range values directly from the parent component's filters object
    const { dateFrom, dateTo } = filters;

    // Parse dates, treating empty as unbounded
    const fromDate = dateFrom ? new Date(dateFrom) : new Date("1900-01-01");
    const toDate = dateTo ? new Date(dateTo) : new Date("2099-12-31");

    // Include entire end date (set to 23:59:59)
    toDate.setHours(23, 59, 59, 999);

    return createdAt >= fromDate && createdAt <= toDate;
  },
})
```

**Why this works**: Your `filterFn` has access to the parent component's `filters` object, which contains the decoded schema values. You don't need to extract them from TanStack's column filters.

### 4. Wire into useDaisyTableFilters

```tsx
const {
  filters,
  pagination,
  setFilterPatch,
  setPagination,
  setSorting,
  sorting,
  // Note: columnFilters and onColumnFiltersChange are NOT needed for this pattern
} = useDaisyTableFilters({
  filterConfig: ADAPTER_CONFIG,
  paginationConfig: { /* ... */ },
  sortingConfig: { /* ... */ },
});

// Pass filters to columns so filterFn can read from it
const columns = useMemo(() => [
  columnHelper.accessor("createdAt", {
    // ... column config ...
    filterFn: (row, _columnId) => {
      // Read from filters (from parent scope)
      const { dateFrom, dateTo } = filters;
      // ... your filtering logic
    },
  }),
], [filters]);  // Include filters in dependency array!

// Render inputs that update the schema fields
<Input
  type="date"
  value={filters.dateFrom}
  handleChange={(value) => setFilterPatch({ dateFrom: value })}
/>
<Input
  type="date"
  value={filters.dateTo}
  handleChange={(value) => setFilterPatch({ dateTo: value })}
/>

// Pass only pagination/sorting state to table; filtering is handled by column filterFn
const table = useReactTable({
  columns,
  data,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  onPaginationChange: setPagination,
  onSortingChange: setSorting,
  state: {
    pagination,
    sorting,
    // Note: no columnFilters
  },
});
```

---

## Data Flow

```
User changes dateFrom input
         ↓
setFilterPatch({ dateFrom: "2025-01-01" })
         ↓
Schema updates, URL becomes ?dateFrom=2025-01-01
         ↓
columns useMemo re-runs (filters changed)
         ↓
TanStack calls column.filterFn() for each row, filterFn reads both dateFrom + dateTo from filters
         ↓
Rows outside the range are filtered out
```

---

## URL Examples

| Scenario | URL |
|----------|-----|
| No filters | `/table` (defaults omitted) |
| From Jan 1, 2025 onwards | `/table?dateFrom=2025-01-01` |
| Up to Dec 31, 2025 | `/table?dateTo=2025-12-31` |
| Full year 2025 | `/table?dateFrom=2025-01-01&dateTo=2025-12-31` |

---

## Testing Strategy

Your tests should verify:

1. **Schema parsing**
   - Empty values default to `""`
   - Invalid dates become defaults
   - Valid dates are preserved

2. **Column filterFn**
   - Rows within range are included
   - Rows before/after range are excluded
   - Boundary dates work correctly
   - Empty dateFrom/dateTo are treated as unbounded
   - No filter applied includes all rows

3. **URL sync**
   - Changing inputs updates URL
   - Reloading page rehydrates from URL
   - Defaults are omitted from URL

---

## Extending This Pattern

### For Multiple Date Fields

If you have separate date fields (e.g., `createdDate` and `modifiedDate`), create separate filters and column filterFns:

```ts
type MultiDateFilters = {
  createdFrom: string;
  createdTo: string;
  modifiedFrom: string;
  modifiedTo: string;
};

const MULTI_DATE_SCHEMA: FilterSchema<MultiDateFilters> = {
  fields: [
    { codec: stringCodec(), defaultValue: "", key: "createdFrom", queryKey: "createdFrom" },
    { codec: stringCodec(), defaultValue: "", key: "createdTo", queryKey: "createdTo" },
    { codec: stringCodec(), defaultValue: "", key: "modifiedFrom", queryKey: "modifiedFrom" },
    { codec: stringCodec(), defaultValue: "", key: "modifiedTo", queryKey: "modifiedTo" },
  ],
};

// Adapter still empty
const CONFIG = {
  adapters: [],
  schema: MULTI_DATE_SCHEMA,
};

// Each column has its own filterFn reading its own pair
columnHelper.accessor("createdAt", {
  filterFn: (row, _columnId) => {
    const createdAt = row.getValue<Date>("createdAt");
    const { createdFrom, createdTo } = filters;
    const fromDate = createdFrom ? new Date(createdFrom) : new Date("1900-01-01");
    const toDate = createdTo ? new Date(createdTo) : new Date("2099-12-31");
    toDate.setHours(23, 59, 59, 999);
    return createdAt >= fromDate && createdAt <= toDate;
  },
})

columnHelper.accessor("modifiedAt", {
  filterFn: (row, _columnId) => {
    const modifiedAt = row.getValue<Date>("modifiedAt");
    const { modifiedFrom, modifiedTo } = filters;
    const fromDate = modifiedFrom ? new Date(modifiedFrom) : new Date("1900-01-01");
    const toDate = modifiedTo ? new Date(modifiedTo) : new Date("2099-12-31");
    toDate.setHours(23, 59, 59, 999);
    return modifiedAt >= fromDate && modifiedAt <= toDate;
  },
})
```

### For Numeric Ranges

Same pattern works for "minPrice"/"maxPrice":

```ts
type PriceFilters = {
  minPrice: string;  // numeric string
  maxPrice: string;
};

const PRICE_SCHEMA: FilterSchema<PriceFilters> = {
  fields: [
    { codec: intCodec({ min: 0 }), defaultValue: 0, key: "minPrice", queryKey: "minPrice" },
    { codec: intCodec(), defaultValue: 0, key: "maxPrice", queryKey: "maxPrice" },
  ],
};

const PRICE_CONFIG = {
  adapters: [],
  schema: PRICE_SCHEMA,
};

columnHelper.accessor("price", {
  filterFn: (row, _columnId) => {
    const price = row.getValue<number>("price");
    const { minPrice = 0, maxPrice = Infinity } = filters as Record<string, number>;
    return price >= minPrice && price <= maxPrice;
  },
})
```

---

## Common Pitfalls

### ❌ Forgetting filters in useMemo dependency array

```ts
// Don't do this:
const columns = useMemo(() => [
  columnHelper.accessor("createdAt", {
    filterFn: (row, _columnId) => {
      // This reads from filters, but columns don't re-run when filters change!
      const { dateFrom, dateTo } = filters;
      // ...
    },
  }),
], []);  // WRONG: missing [filters]
```

```ts
// ✅ Do this:
const columns = useMemo(() => [
  columnHelper.accessor("createdAt", {
    filterFn: (row, _columnId) => {
      const { dateFrom, dateTo } = filters;
      // ...
    },
  }),
], [filters]);  // Include filters!
```

### ❌ Trying to use TanStack column filters

```ts
// Don't do this:
const {
  columnFilters,
  onColumnFiltersChange,
} = useDaisyTableFilters(config);

const table = useReactTable({
  // ...
  state: {
    columnFilters,  // Not needed—filterFn reads from filters directly
  },
  onColumnFiltersChange,  // Not needed
});
```

This pattern doesn't use TanStack's column filter mechanism. Instead, your column's `filterFn` reads from the component's `filters` object, which comes from the schema.

### ❌ Using object shorthand in Filters

```ts
// Don't do this:
type Filters = { dateRange: string };  // Single field with `|`-separated values

// ✅ Do this:
type Filters = { dateFrom: string; dateTo: string };  // Two fields
```

Separate fields are more composable and URL-friendly.

---

## Working Example

See `apps/daisy-showcase/src/tables/DateRangeTable.tsx` for a complete, runnable example with:
- Sample event data with various dates
- Date range filter UI with inputs
- Custom `filterFn` applying range logic
- Full test suite demonstrating all edge cases

Run tests:

```bash
pnpm test:ci -- DateRangeTable.test.ts
```



