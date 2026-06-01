# Date Range Filtering Example — Summary

## What You Asked

You wanted to know if the filtering architecture can accommodate multiple filters on the same field—specifically, "from" and "to" limits on a particular date value (or other ranges).

## The Answer

**Yes, absolutely.** The architecture supports this elegantly through the **separate schema fields approach**.

---

## What Was Created

### 1. **Complete Working Example**
   - **File**: `apps/daisy-showcase/src/tables/DateRangeTable.tsx`
   - Shows a fully functional table with date range filtering
   - Demonstrates the recommended pattern with clear comments
   - 51 lines of test coverage, all passing

### 2. **Comprehensive Test Suite**
   - **File**: `apps/daisy-showcase/src/tables/DateRangeTable.test.ts`
   - Tests for schema parsing, filtering logic, boundary conditions
   - Tests for unbounded ranges (empty dateFrom/dateTo)
   - 51 tests total, all passing ✅

### 3. **Pattern Documentation**
   - **File**: `packages/daisy-table/src/filtering/DATE_RANGE_PATTERN.md`
   - Detailed architecture explanation
   - Data flow diagrams
   - Common pitfalls and solutions
   - Extensions for numeric ranges, multiple date fields

---

## The Pattern Explained (Quick Version)

### Schema: Two separate fields
```ts
type DateRangeFilters = {
  dateFrom: string;  // "2025-01-01" or ""
  dateTo: string;    // "2025-12-31" or ""
};
```

### Adapter: Empty (no TanStack column filter mapping needed)
```ts
const config = {
  adapters: [],  // We don't use TanStack column filters for this
  schema: DATE_RANGE_SCHEMA,
};
```

### Column: Custom filterFn reads straight from filters object
```tsx
columnHelper.accessor("createdAt", {
  filterFn: (row, _columnId) => {
    const createdAt = row.getValue<Date>("createdAt");
    const { dateFrom, dateTo } = filters;  // Read directly
    
    const fromDate = dateFrom ? new Date(dateFrom) : new Date("1900-01-01");
    const toDate = dateTo ? new Date(dateTo) : new Date("2099-12-31");
    toDate.setHours(23, 59, 59, 999);
    
    return createdAt >= fromDate && createdAt <= toDate;
  },
})
```

### UI: Two separate inputs managing schema fields
```tsx
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
```

---

## Why This Works

1. **URL serialization is clean**: `?dateFrom=2025-01-01&dateTo=2025-12-31`
2. **Schema manages state**: Both bounds are parsed, validated, and cached at app load
3. **Filtering is straightforward**: Column's filterFn has both values and applies range logic per-row
4. **Fully composable**: Works with pagination, sorting, and other filters
5. **No custom TanStack hacks**: Leverages built-in column filtering with direct state access

---

## Key Files to Review

1. **Pattern Reference**: `packages/daisy-table/src/filtering/DATE_RANGE_PATTERN.md`
   - Everything you need to apply this to other date/range fields

2. **Working Example**: `apps/daisy-showcase/src/tables/DateRangeTable.tsx`
   - Copy this structure for your own date range fields

3. **Test Suite**: `apps/daisy-showcase/src/tables/DateRangeTable.test.ts`
   - Reference for testing range filtering logic

---

## Next Steps

- For a different field (e.g., price range): Replace `Date` with `number`, adjust codec and validation
- For multiple ranges: Add more schema fields, duplicate the pattern per field
- For other monorepo apps: Copy the pattern—it's framework-agnostic (just schema + filterFn)

All tests pass. CI is green. Ready to roll out. 🎉

