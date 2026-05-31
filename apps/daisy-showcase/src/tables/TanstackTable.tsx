"use client";

/**
 * Table with Tanstack Table formatting and DaisyUI styling.
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

import type { User } from "@/types/types";

// Public Objects ------------------------------------------------------------

export type TanstackTableProps = {
  // Dummy user data
  users: User[];
};

export function TanstackTable({ users }: TanstackTableProps) {
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
    paginationConfig: {
      defaultValue: {
        pageIndex: 0,
        pageSize: 5,
      },
    },
    sortingConfig: {
      defaultValue: [
        {
          desc: false,
          id: "id",
        },
      ],
    },
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        cell: (info: CellContext<User, number>) => info.getValue(),
        enableSorting: true,
        header: "Id",
      }),
      columnHelper.accessor("name", {
        cell: (info: CellContext<User, string>) => info.getValue(),
        enableSorting: true,
        header: "Name",
      }),
      columnHelper.accessor("email", {
        cell: (info: CellContext<User, string>) => info.getValue(),
        header: "Email",
      }),
      columnHelper.accessor("phone", {
        cell: (info: CellContext<User, string>) => info.getValue(),
        header: "Phone",
      }),
    ],
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<User>({
    columns,
    data: users,
    enableSorting: true,
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row flex-wrap gap-2 justify-center">
        <Input
          handleChange={(value) => setFilterPatch({ name: value })}
          id="name"
          label="Filter by Name:"
          name="nameFilter"
          placeholder="Enter part of name"
          value={filters.name}
        />
        <Input
          handleChange={(value) => setFilterPatch({ email: value })}
          id="email"
          label="Filter by Email:"
          name="emailFilter"
          placeholder="Enter part of email"
          value={filters.email}
        />
        <Input
          handleChange={(value) => setFilterPatch({ phone: value })}
          id="phone"
          label="Filter by Phone:"
          name="phoneFilter"
          placeholder="Enter part of phone"
          value={filters.phone}
        />
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

type UserTableFilters = {
  email: string;
  name: string;
  phone: string;
};

const actions: TableAction<User>[] = [
  {
    icon: <Package size={16} />,
    label: "First",
    onClick: (row) => {
      alert(`First action for ${row.original.name}`);
    },
  },
  {
    icon: <Paperclip size={16} />,
    label: "Second",
    onClick: (row) => {
      alert(`Second action for ${row.original.name}`);
    },
  },
  {
    icon: <Pencil size={16} />,
    label: "Third",
    onClick: (row) => {
      alert(`Third action for ${row.original.name}`);
    },
  },
];

const columnHelper = createColumnHelper<User>();

const USER_FILTER_SCHEMA: FilterSchema<UserTableFilters> = {
  fields: [
    {
      codec: stringCodec(),
      defaultValue: "",
      key: "email",
      queryKey: "email",
    },
    {
      codec: stringCodec(),
      defaultValue: "",
      key: "name",
      queryKey: "name",
    },
    {
      codec: stringCodec(),
      defaultValue: "",
      key: "phone",
      queryKey: "phone",
    },
  ],
};

const USER_FILTER_ADAPTER_CONFIG: TanStackFilterAdapterConfig<UserTableFilters> = {
  adapters: [
    {
      columnId: "email",
      key: "email",
    },
    {
      columnId: "name",
      key: "name",
    },
    {
      columnId: "phone",
      key: "phone",
    },
  ],
  schema: USER_FILTER_SCHEMA,
};
