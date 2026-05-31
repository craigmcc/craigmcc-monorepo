"use client";

/**
 * Table with Tanstack Table formatting and DaisyUI styling.
 */

// External Modules ----------------------------------------------------------

import { Input } from "@repo/daisy-ui/Input";
import { DataTable, TableAction } from "@repo/daisy-table/DataTable";
import {
  CellContext,
  ColumnFiltersState,
  createColumnHelper,
//  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Package, Paperclip, Pencil } from "lucide-react";
import { useMemo, useState } from "react";

// Internal Modules ----------------------------------------------------------

import { User } from "@/types/types";

// Public Objects ------------------------------------------------------------

export type TanstackTableProps = {
  // Dummy user data
  users: User[],
}

export function TanstackTable({ users }: TanstackTableProps) {

  const [emailFilter, setEmailFilter] = useState<string>("");
  const [nameFilter, setNameFilter] = useState<string>("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [phoneFilter, setPhoneFilter] = useState<string>("");
  const [sorting, setSorting] = useState<SortingState>([
    {id: "id", desc: false},
  ]);

  // Derive column filters directly from the individual filter values
  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = [];
    if (emailFilter.length > 0) {
      filters.push({ id: "email", value: emailFilter });
    }
    if (nameFilter.length > 0) {
      filters.push({ id: "name", value: nameFilter });
    }
    if (phoneFilter.length > 0) {
      filters.push({ id: "phone", value: phoneFilter });
    }
    return filters;
  }, [emailFilter, nameFilter, phoneFilter]);

  const columns = useMemo(() => [
    columnHelper.accessor("id", {
      enableSorting: true,
      header: "Id",
      cell: (info: CellContext<User, number>) => info.getValue(),
    }),
    columnHelper.accessor("name", {
      enableSorting: true,
      header: "Name",
      cell: (info: CellContext<User, string>) => info.getValue(),
    }),
    columnHelper.accessor("email", {
      header: "Email",
      cell: (info: CellContext<User, string>) => info.getValue(),
    }),
    columnHelper.accessor("phone", {
      header: "Phone",
      cell: (info: CellContext<User, string>) => info.getValue(),
    }),
  ], []);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<User>({
    columns,
    data: users,
    enableSorting: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      pagination,
      sorting
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row flex-wrap gap-2 justify-center">
        <Input
          handleChange={(value) => setNameFilter(value)}
          id="name"
          label="Filter by Name:"
          name="nameFilter"
          placeholder="Enter part of name"
          value={nameFilter}
        />
        <Input
          handleChange={(value) => setEmailFilter(value)}
          id="email"
          label="Filter by Email:"
          name="emailFilter"
          placeholder="Enter part of email"
          value={emailFilter}
        />
        <Input
          handleChange={(value) => setPhoneFilter(value)}
          id="phone"
          label="Filter by Phone:"
          name="phoneFilter"
          placeholder="Enter part of phone"
          value={phoneFilter}
        />
      </div>
      <DataTable
        actions={actions}
        border
        pinRows
        showPagination={true}
        table={table}
        zebra
      />
    </div>
  )

}

// Private Objects -----------------------------------------------------------

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
