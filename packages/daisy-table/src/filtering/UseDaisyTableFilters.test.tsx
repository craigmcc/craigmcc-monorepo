/**
 * Integration-style tests for the useDaisyTableFilters hook URL/state synchronization.
 */

// External Imports ----------------------------------------------------------

import { renderWithProviders } from "@repo/testing-react";
import { intCodec, stringCodec, type FilterSchema } from "@repo/shared-utils/filters";
import { type PaginationState, type SortingState } from "@tanstack/react-table";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";

// Internal Imports ----------------------------------------------------------

import { type TanStackFilterAdapterConfig } from "./TanStackFilterAdapters";
import { useDaisyTableFilters } from "./UseDaisyTableFilters";

// Public Objects ------------------------------------------------------------

// Private Objects -----------------------------------------------------------

type ShowcaseFilters = {
  name: string;
  pageOverride: number;
};

const FILTER_SCHEMA: FilterSchema<ShowcaseFilters> = {
  fields: [
    {
      codec: stringCodec(),
      defaultValue: "",
      key: "name",
      queryKey: "name",
    },
    {
      codec: intCodec({ min: 1 }),
      defaultValue: 1,
      key: "pageOverride",
      queryKey: "pageOverride",
    },
  ],
};

const FILTER_CONFIG: TanStackFilterAdapterConfig<ShowcaseFilters> = {
  adapters: [
    {
      columnId: "name",
      key: "name",
      toColumnValue: (value) => value,
    },
  ],
  schema: FILTER_SCHEMA,
};

const DEFAULT_PAGINATION: PaginationState = {
  pageIndex: 0,
  pageSize: 5,
};

const DEFAULT_SORTING: SortingState = [];

type HookHarnessProps = {
  onSnapshot: (snapshot: {
    columnFilters: Array<{ id: string; value: unknown }>;
    filters: ShowcaseFilters;
    pagination: PaginationState;
    sorting: SortingState;
  }) => void;
};

function HookHarness({ onSnapshot }: HookHarnessProps) {
  const state = useDaisyTableFilters({
    filterConfig: FILTER_CONFIG,
    paginationConfig: {
      defaultValue: DEFAULT_PAGINATION,
    },
    sortingConfig: {
      defaultValue: DEFAULT_SORTING,
    },
  });

  useEffect(() => {
    onSnapshot({
      columnFilters: state.columnFilters,
      filters: state.filters,
      pagination: state.pagination,
      sorting: state.sorting,
    });
  }, [onSnapshot, state.columnFilters, state.filters, state.pagination, state.sorting]);

  return (
    <button
      onClick={() => {
        state.setFilterPatch({ name: "amy" });
        state.setSorting([{ desc: true, id: "name" }]);
        state.setPagination({ pageIndex: 2, pageSize: 25 });
      }}
      type="button"
    >
      Update
    </button>
  );
}

describe("useDaisyTableFilters", () => {
  it("hydrates initial state from URL params", () => {
    window.history.replaceState(null, "", "?name=zed&sort=name:desc&page=1&pageSize=20");

    const snapshots: Array<{
      columnFilters: Array<{ id: string; value: unknown }>;
      filters: ShowcaseFilters;
      pagination: PaginationState;
      sorting: SortingState;
    }> = [];

    renderWithProviders(
      <HookHarness
        onSnapshot={(snapshot) => {
          snapshots.push(snapshot);
        }}
      />,
    );

    expect(snapshots.at(-1)).toEqual({
      columnFilters: [{ id: "name", value: "zed" }],
      filters: {
        name: "zed",
        pageOverride: 1,
      },
      pagination: {
        pageIndex: 1,
        pageSize: 20,
      },
      sorting: [{ desc: true, id: "name" }],
    });
  });

  it("syncs updates back into URL params", async () => {
    window.history.replaceState(null, "", "/");

    const { getByRole, user } = renderWithProviders(
      <HookHarness
        onSnapshot={() => {
          // no-op for this test
        }}
      />,
    );

    await user.click(getByRole("button", { name: "Update" }));

    const searchParams = new URLSearchParams(window.location.search);
    expect(searchParams.get("name")).toBe("amy");
    expect(searchParams.get("sort")).toBe("name:desc");
    expect(searchParams.get("page")).toBe("2");
    expect(searchParams.get("pageSize")).toBe("25");
  });
});
