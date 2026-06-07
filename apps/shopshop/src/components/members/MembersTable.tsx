"use client";

/**
 * Table of all List Memberships this Profile is part of,
 * including nested Lists, Categories, and Items.
 */

// External Imports ----------------------------------------------------------

import { DataTable, type TableAction } from "@repo/daisy-table/DataTable";
import { Card } from "@repo/daisy-ui/Card";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

// Internal Imports ----------------------------------------------------------

import type { MemberPlus } from "@/types/Types";

// Public Objects ------------------------------------------------------------

export type MembersTableProps = {
  // Members with associated Lists, Categories, and Items
  members: MemberPlus[];
}

export function MembersTable({ members }: MembersTableProps) {

  const router = useRouter();

  const actions: TableAction<MemberPlus>[] = [
    {
      label: "Go Shopping",
      onClick: (row => {
        router.push(`/shop/${row.original.listId}`);
      }),
    },
    {
      label: "Edit List",
      onClick: (row => {
        router.push(`/list/${row.original.listId}`);
      }),
    },
  ];

  // Define columns for this table
  const columns = useMemo(() => [
    columnHelper.display({
      cell: info => {
        return info.row.original.role === "ADMIN"
          ? "Admin" : "Guest";
      },
      header: "Role",
      id: "role",
    }),
    columnHelper.display({
      cell: info => {
        return info.row.original.list!.name
      },
      header: "List Name",
      id: "name",
    }),
  ], []);

  // Define the table itself
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<MemberPlus>({
    columns,
    data: members,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card
      border
      size="md"
    >
      <Card.Title className="justify-center">My Lists</Card.Title>
      <Card.Body>
        <DataTable
          actions={actions}
          border
          table={table}
          zebra
        />
      </Card.Body>
    </Card>
  )

}

// Private Objects -----------------------------------------------------------

const columnHelper = createColumnHelper<MemberPlus>();
