"use client";

/**
 * Example table demonstrating date range filtering using separate schema fields.
 *
 * This example shows the recommended pattern for "from" and "to" limits on a single field:
 * - Define separate schema fields for dateFrom and dateTo
 * - Map them to a single logical columnId in the adapter
 * - Implement range logic in the column's filterFn
 *
 * URL encoding is clean: ?dateFrom=2025-01-01&dateTo=2025-12-31
 */

// External Imports ----------------------------------------------------------

import { Input } from "@repo/daisy-ui/Input";
import { DataTable, type TableAction } from "@repo/daisy-table/DataTable";
import {
  type TanStackFilterAdapterConfig,
  useDaisyTableFilters,
} from "@repo/daisy-table/filtering";
import { stringCodec, type FilterSchema } from "@repo/shared-utils/filters";
import {
  type CellContext,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Package, Paperclip, Pencil } from "lucide-react";
import { useMemo } from "react";

// Internal Imports ----------------------------------------------------------

// Public Objects ----------------------------------------------------------

export type DateRangeTableProps = {
  // Sample event data with creation dates
  events: Event[];
};

export function DateRangeTable({ events }: DateRangeTableProps) {
  const {
    filters,
    pagination,
    setFilterPatch,
    setPagination,
    setSorting,
    sorting,
  } = useDaisyTableFilters({
    filterConfig: EVENT_FILTER_ADAPTER_CONFIG,
    paginationConfig: {
      defaultValue: {
        pageIndex: 0,
        pageSize: 5,
      },
    },
    sortingConfig: {
      defaultValue: [
        {
          desc: true,
          id: "createdAt",
        },
      ],
    },
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        cell: (info: CellContext<Event, number>) => info.getValue(),
        enableSorting: true,
        header: "Id",
      }),
      columnHelper.accessor("title", {
        cell: (info: CellContext<Event, string>) => info.getValue(),
        enableSorting: true,
        header: "Title",
      }),
      columnHelper.accessor("createdAt", {
        cell: (info: CellContext<Event, Date>) => info.getValue().toLocaleDateString(),
        enableSorting: true,
        header: "Created",
        // Custom filter function that applies the date range from separate schema fields.
        // Note: In this pattern, we read the range values directly from the parent component's
        // filters object, NOT from TanStack's columnFilters. This keeps the logic simple and
        // avoids the complexity of mapping multiple schema fields to a single column.
        filterFn: (row, _columnId) => {
          const createdAt = row.getValue<Date>("createdAt");
          const { dateFrom, dateTo } = filters;

          // Parse dates, treating empty strings as unbounded
          const fromDate = dateFrom ? new Date(dateFrom) : new Date("1900-01-01");
          const toDate = dateTo ? new Date(dateTo) : new Date("2099-12-31");

          // Ensure toDate is end-of-day (23:59:59) to include the entire day
          toDate.setHours(23, 59, 59, 999);

          return createdAt >= fromDate && createdAt <= toDate;
        },
      }),
      columnHelper.accessor("description", {
        cell: (info: CellContext<Event, string>) => info.getValue(),
        header: "Description",
      }),
    ],
    [filters],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<Event>({
    columns,
    data: events,
    enableSorting: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    state: {
      pagination,
      sorting,
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 p-4 border border-gray-200 rounded">
        <h3 className="font-semibold">Date Range Filter</h3>
        <div className="flex flex-row flex-wrap gap-2">
          <Input
            handleChange={(value) => setFilterPatch({ dateFrom: value })}
            id="dateFrom"
            label="From Date:"
            name="dateFromFilter"
            placeholder="YYYY-MM-DD"
            type="date"
            value={filters.dateFrom}
          />
          <Input
            handleChange={(value) => setFilterPatch({ dateTo: value })}
            id="dateTo"
            label="To Date:"
            name="dateToFilter"
            placeholder="YYYY-MM-DD"
            type="date"
            value={filters.dateTo}
          />
        </div>
        <p className="text-sm text-gray-600">
          {filters.dateFrom || filters.dateTo
            ? `Filtering from ${filters.dateFrom || "—"} to ${filters.dateTo || "—"}`
            : "No date filter applied"}
        </p>
      </div>

      <DataTable
        actions={actions}
        border
        pinRows
        showPagination
        table={table}
        zebra
      />
    </div>
  );
}

// Private Objects -----------------------------------------------------------

type Event = {
  // Unique identifier
  id: number;
  // Event title
  title: string;
  // Event description
  description: string;
  // Creation date
  createdAt: Date;
};

type EventFilters = {
  // ISO date string for range start (empty = unbounded)
  dateFrom: string;
  // ISO date string for range end (empty = unbounded)
  dateTo: string;
};

// Schema defines logical filter fields and their serialization behavior.
// Each field maps to a query parameter (dateFrom, dateTo) independently.
const EVENT_FILTER_SCHEMA: FilterSchema<EventFilters> = {
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

// Adapter config for date range filtering.
// In this pattern, we use schema fields to manage state and URL serialization,
// and the column filterFn reads directly from the filters object.
// Therefore, we don't need TanStack column filter adapters—we use an empty array.
const EVENT_FILTER_ADAPTER_CONFIG: TanStackFilterAdapterConfig<EventFilters> = {
  adapters: [],
  schema: EVENT_FILTER_SCHEMA,
};

const actions: TableAction<Event>[] = [
  {
    icon: <Package size={16} />,
    label: "Edit",
    onClick: (row) => {
      alert(`Edit action for event: ${row.original.title}`);
    },
  },
  {
    icon: <Paperclip size={16} />,
    label: "Archive",
    onClick: (row) => {
      alert(`Archive action for event: ${row.original.title}`);
    },
  },
  {
    icon: <Pencil size={16} />,
    label: "Delete",
    onClick: (row) => {
      alert(`Delete action for event: ${row.original.title}`);
    },
  },
];

const columnHelper = createColumnHelper<Event>();

// Sample events spanning 2025
const SAMPLE_EVENTS: Event[] = [
  {
    id: 1,
    title: "Q1 Planning Session",
    description: "Quarterly planning for 2025",
    createdAt: new Date("2025-01-15"),
  },
  {
    id: 2,
    title: "Team Offsite",
    description: "Annual team building event",
    createdAt: new Date("2025-02-20"),
  },
  {
    id: 3,
    title: "Product Launch",
    description: "Version 2.0 release",
    createdAt: new Date("2025-03-10"),
  },
  {
    id: 4,
    title: "Customer Summit",
    description: "Annual customer conference",
    createdAt: new Date("2025-05-22"),
  },
  {
    id: 5,
    title: "Mid-Year Review",
    description: "Performance reviews",
    createdAt: new Date("2025-06-30"),
  },
  {
    id: 6,
    title: "Security Audit",
    description: "Third-party security assessment",
    createdAt: new Date("2025-08-15"),
  },
  {
    id: 7,
    title: "Q4 Planning",
    description: "Final quarter planning",
    createdAt: new Date("2025-09-05"),
  },
  {
    id: 8,
    title: "Year-End Party",
    description: "Annual celebration",
    createdAt: new Date("2025-12-20"),
  },
];







