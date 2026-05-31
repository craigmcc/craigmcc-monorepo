/**
 * Unit tests for TanStack sorting and pagination URL adapters.
 */

// External Imports ----------------------------------------------------------

import type { PaginationState, SortingState } from "@tanstack/react-table";
import { describe, expect, it } from "vitest";

// Internal Imports ----------------------------------------------------------

import {
  parsePaginationState,
  parseSortingState,
  serializePaginationState,
  serializeSortingState,
  type TanStackPaginationConfig,
  type TanStackSortingConfig,
} from "./TanStackStateAdapters";

// Public Objects ------------------------------------------------------------

// Private Objects -----------------------------------------------------------

const DEFAULT_PAGINATION: PaginationState = {
  pageIndex: 0,
  pageSize: 10,
};

const DEFAULT_SORTING: SortingState = [];

const PAGINATION_CONFIG: TanStackPaginationConfig = {
  defaultValue: DEFAULT_PAGINATION,
  maxPageSize: 50,
  minPageSize: 5,
};

const SORTING_CONFIG: TanStackSortingConfig = {
  defaultValue: DEFAULT_SORTING,
};

describe("TanStackStateAdapters", () => {
  it("parses pagination from URL params and applies bounds", () => {
    const params = new URLSearchParams("page=2&pageSize=200");

    const pagination = parsePaginationState(PAGINATION_CONFIG, (queryKey) => params.get(queryKey));

    expect(pagination).toEqual({
      pageIndex: 2,
      pageSize: 50,
    });
  });

  it("falls back to default pagination for invalid params", () => {
    const params = new URLSearchParams("page=bad&pageSize=bad");

    const pagination = parsePaginationState(PAGINATION_CONFIG, (queryKey) => params.get(queryKey));

    expect(pagination).toEqual(DEFAULT_PAGINATION);
  });

  it("serializes pagination while omitting default values", () => {
    const params = new URLSearchParams("stale=1");

    serializePaginationState(
      PAGINATION_CONFIG,
      {
        pageIndex: 0,
        pageSize: 25,
      },
      (queryKey, value) => {
        if (value === null) {
          params.delete(queryKey);
          return;
        }
        params.set(queryKey, value);
      },
    );

    expect(params.get("page")).toBeNull();
    expect(params.get("pageSize")).toBe("25");
    expect(params.get("stale")).toBe("1");
  });

  it("parses sorting from encoded URL values", () => {
    const params = new URLSearchParams("sort=name:asc,id:desc");

    const sorting = parseSortingState(SORTING_CONFIG, (queryKey) => params.get(queryKey));

    expect(sorting).toEqual([
      { desc: false, id: "name" },
      { desc: true, id: "id" },
    ]);
  });

  it("falls back to defaults when sorting params are invalid", () => {
    const params = new URLSearchParams("sort=badvalue");

    const sorting = parseSortingState(SORTING_CONFIG, (queryKey) => params.get(queryKey));

    expect(sorting).toEqual(DEFAULT_SORTING);
  });

  it("serializes sorting and omits default sorting", () => {
    const params = new URLSearchParams();

    serializeSortingState(
      SORTING_CONFIG,
      [
        { desc: false, id: "name" },
        { desc: true, id: "id" },
      ],
      (queryKey, value) => {
        if (value === null) {
          params.delete(queryKey);
          return;
        }
        params.set(queryKey, value);
      },
    );

    expect(params.get("sort")).toBe("name:asc,id:desc");

    serializeSortingState(
      SORTING_CONFIG,
      DEFAULT_SORTING,
      (queryKey, value) => {
        if (value === null) {
          params.delete(queryKey);
          return;
        }
        params.set(queryKey, value);
      },
    );

    expect(params.get("sort")).toBeNull();
  });
});
