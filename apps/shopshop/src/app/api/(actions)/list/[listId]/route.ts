/**
 * Route handler for List update and delete mutations.
 */

// External Imports ----------------------------------------------------------

import { ListUpdateSchemaType } from "@repo/db-shopshop/zod-schemas/ListSchema";
import { NextRequest, NextResponse } from "next/server";

// Internal Imports ----------------------------------------------------------

import { deleteList, updateList } from "@/actions/ListActions";

// Public Objects ------------------------------------------------------------

type RouteContext = {
  params: Promise<{ listId: string }>;
};

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  void request;
  const { listId } = await params;
  const result = await deleteList(listId);
  if (result.model) {
    return NextResponse.json({
      data: result.model,
      success: true,
    });
  }

  const status = result.status || 400;
  return NextResponse.json({
    error: result.message,
    status,
  }, {
    status,
  });
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { listId } = await params;
  const data: ListUpdateSchemaType = await request.json();
  const result = await updateList(listId, data);
  if (result.model) {
    return NextResponse.json({
      data: result.model,
      success: true,
    });
  }

  const status = result.status || 400;
  return NextResponse.json({
    error: result.message,
    status,
  }, {
    status,
  });
}

// Private Objects -----------------------------------------------------------

