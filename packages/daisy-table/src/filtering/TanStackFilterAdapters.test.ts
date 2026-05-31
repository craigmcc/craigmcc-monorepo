/**
 * Unit tests for mapping shared filter schema state to and from TanStack column filters.
 */

// External Imports ----------------------------------------------------------

import {
  booleanCodec,
  intCodec,
  type FilterSchema,
} from "@repo/shared-utils/filters";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { describe, expect, it } from "vitest";

// Internal Imports ----------------------------------------------------------

import {
  fromColumnFiltersState,
  toColumnFiltersState,
  type TanStackFilterAdapterConfig,
} from "./TanStackFilterAdapters";

// Public Objects ------------------------------------------------------------

// Private Objects -----------------------------------------------------------

type ProductFilters = {
  inStock: boolean;
  minPrice: number;
};

const PRODUCT_FILTER_SCHEMA: FilterSchema<ProductFilters> = {
  fields: [
    {
      codec: booleanCodec(),
      defaultValue: false,
      key: "inStock",
      queryKey: "inStock",
    },
    {
      codec: intCodec({ min: 0 }),
      defaultValue: 0,
      key: "minPrice",
      queryKey: "minPrice",
    },
  ],
};

const PRODUCT_FILTER_ADAPTERS: TanStackFilterAdapterConfig<ProductFilters> = {
  adapters: [
    {
      columnId: "inStock",
      fromColumnValue: (columnValue) => columnValue === true,
      key: "inStock",
      toColumnValue: (value) => value,
    },
    {
      columnId: "price",
      fromColumnValue: (columnValue) => {
        if (typeof columnValue !== "number") {
          return undefined;
        }
        return columnValue;
      },
      key: "minPrice",
      toColumnValue: (value) => value,
    },
  ],
  schema: PRODUCT_FILTER_SCHEMA,
};

describe("TanStackFilterAdapters", () => {
  it("returns defaults when column filters do not contain mapped entries", () => {
    const result = fromColumnFiltersState(PRODUCT_FILTER_ADAPTERS, []);

    expect(result).toEqual({
      inStock: false,
      minPrice: 0,
    });
  });

  it("maps column filters into shared state", () => {
    const columnFilters: ColumnFiltersState = [
      { id: "inStock", value: true },
      { id: "price", value: 125 },
    ];

    const result = fromColumnFiltersState(PRODUCT_FILTER_ADAPTERS, columnFilters);

    expect(result).toEqual({
      inStock: true,
      minPrice: 125,
    });
  });

  it("omits inactive values when converting state to column filters", () => {
    const result = toColumnFiltersState(PRODUCT_FILTER_ADAPTERS, {
      inStock: false,
      minPrice: 0,
    });

    expect(result).toEqual([]);
  });

  it("includes active values when converting state to column filters", () => {
    const result = toColumnFiltersState(PRODUCT_FILTER_ADAPTERS, {
      inStock: true,
      minPrice: 30,
    });

    expect(result).toEqual([
      { id: "inStock", value: true },
      { id: "price", value: 30 },
    ]);
  });
});
