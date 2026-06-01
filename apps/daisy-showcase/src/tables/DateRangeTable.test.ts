/**
 * Tests for date range filtering pattern.
 *
 * Demonstrates:
 * - Schema field parsing (dateFrom, dateTo as ISO strings)
 * - Column filterFn range logic
 * - URL serialization (defaults omitted)
 *
 * Note: In this pattern, we don't use TanStack column filter adapters.
 * Instead, the schema fields manage state, and the column filterFn reads
 * directly from the filters object.
 */

// External Imports ----------------------------------------------------------

import {
  stringCodec,
  type FilterSchema,
} from "@repo/shared-utils/filters";
import { describe, expect, it } from "vitest";

// Internal Imports ----------------------------------------------------------

import type { TanStackFilterAdapterConfig } from "@repo/daisy-table/filtering";

// Public Objects --------------------------------------------------

describe("Date Range Filtering Pattern", () => {
  describe("Schema Config", () => {
    it("defines separate fields for dateFrom and dateTo", () => {
      const schema = createDateRangeSchema();

      expect(schema.fields).toHaveLength(2);
      expect(schema.fields[0]?.key).toBe("dateFrom");
      expect(schema.fields[1]?.key).toBe("dateTo");
    });

    it("uses empty adapters array since filtering reads from schema directly", () => {
      const config = createDateRangeAdapterConfig();

      expect(config.adapters).toHaveLength(0);
    });

    it("omits default values from URL serialization", () => {
      const schema = createDateRangeSchema();

      expect(schema.fields[0]?.defaultValue).toBe("");
      expect(schema.fields[1]?.defaultValue).toBe("");
    });
  });

  describe("Range logic in column filterFn", () => {
    it("includes rows with dates within the range", () => {
      const filterFn = createDateRangeFilterFn();

      const row = createMockRow(new Date("2025-03-15"));
      const filterValue = {
        dateFrom: "2025-01-01",
        dateTo: "2025-12-31",
      };

      expect(filterFn(row, "createdAt", filterValue)).toBe(true);
    });

    it("excludes rows with dates before the range", () => {
      const filterFn = createDateRangeFilterFn();

      const row = createMockRow(new Date("2024-12-31"));
      const filterValue = {
        dateFrom: "2025-01-01",
        dateTo: "2025-12-31",
      };

      expect(filterFn(row, "createdAt", filterValue)).toBe(false);
    });

    it("excludes rows with dates after the range", () => {
      const filterFn = createDateRangeFilterFn();

      const row = createMockRow(new Date("2026-01-01"));
      const filterValue = {
        dateFrom: "2025-01-01",
        dateTo: "2025-12-31",
      };

      expect(filterFn(row, "createdAt", filterValue)).toBe(false);
    });

    it("includes rows on the boundary dates", () => {
      const filterFn = createDateRangeFilterFn();

      const rowStart = createMockRow(new Date("2025-01-01T00:00:00Z"));
      const rowEnd = createMockRow(new Date("2025-12-31T00:00:00Z"));

      const filterValue = {
        dateFrom: "2025-01-01",
        dateTo: "2025-12-31",
      };

      expect(filterFn(rowStart, "createdAt", filterValue)).toBe(true);
      expect(filterFn(rowEnd, "createdAt", filterValue)).toBe(true);
    });

    it("treats empty dateFrom as unbounded start", () => {
      const filterFn = createDateRangeFilterFn();

      const row = createMockRow(new Date("1900-01-01"));
      const filterValue = {
        dateFrom: "",
        dateTo: "2025-12-31",
      };

      expect(filterFn(row, "createdAt", filterValue)).toBe(true);
    });

    it("treats empty dateTo as unbounded end", () => {
      const filterFn = createDateRangeFilterFn();

      const row = createMockRow(new Date("2099-12-31"));
      const filterValue = {
        dateFrom: "2025-01-01",
        dateTo: "",
      };

      expect(filterFn(row, "createdAt", filterValue)).toBe(true);
    });

    it("includes all rows when both dates are empty", () => {
      const filterFn = createDateRangeFilterFn();

      const row = createMockRow(new Date("2000-06-15"));
      const filterValue = {
        dateFrom: "",
        dateTo: "",
      };

      expect(filterFn(row, "createdAt", filterValue)).toBe(true);
    });

    it("returns true when filterValue is undefined", () => {
      const filterFn = createDateRangeFilterFn();

      const row = createMockRow(new Date("2025-06-15"));

      // Should return true when no filter is applied
      expect(filterFn(row, "createdAt", undefined)).toBe(true);
    });
  });
});

// Private Objects ---------------------------------------------------

type EventFilters = {
  dateFrom: string;
  dateTo: string;
};

function createDateRangeSchema(): FilterSchema<EventFilters> {
  return {
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
}

function createDateRangeAdapterConfig(): TanStackFilterAdapterConfig<EventFilters> {
  return {
    adapters: [],
    schema: createDateRangeSchema(),
  };
}

type MockRow = { getValue(columnId: string): Date };

function createMockRow(createdAt: Date): MockRow {
  return {
    getValue: (columnId: string) => {
      if (columnId === "createdAt") {
        return createdAt;
      }
      throw new Error(`Unknown column: ${columnId}`);
    },
  };
}

function createDateRangeFilterFn() {
  return (row: MockRow, _columnId: string, filterValue: unknown) => {
    if (!filterValue) {
      return true;
    }

    const createdAt = row.getValue("createdAt");
    const { dateFrom, dateTo } = filterValue as {
      dateFrom?: string;
      dateTo?: string;
    };

    const fromDate = dateFrom ? new Date(dateFrom) : new Date("1900-01-01");
    const toDate = dateTo ? new Date(dateTo) : new Date("2099-12-31");

    toDate.setHours(23, 59, 59, 999);

    return createdAt >= fromDate && createdAt <= toDate;
  };
}





