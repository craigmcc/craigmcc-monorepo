/**
 * Route handler for Item update and delete mutations.
 */

// External Imports ----------------------------------------------------------

import { ItemUpdateSchemaType } from "@repo/db-shopshop/zod-schemas/ItemSchema";
import { NextRequest, NextResponse } from "next/server";

// Internal Imports ----------------------------------------------------------

import { deleteItem, updateItem } from "@/actions/ItemActions";

// Public Objects ------------------------------------------------------------

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  void request;
  const { itemId } = await params;
  const result = await deleteItem(itemId);
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
  const { itemId } = await params;
  const data: ItemUpdateSchemaType = await request.json();
  const result = await updateItem(itemId, data);
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

