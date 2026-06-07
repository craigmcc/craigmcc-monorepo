/**
 * Route handler for Category update and delete mutations.
 */

// External Imports ----------------------------------------------------------

import { CategoryUpdateSchemaType } from "@repo/db-shopshop/zod-schemas/CategorySchema";
import { NextRequest, NextResponse } from "next/server";

// Internal Imports ----------------------------------------------------------

import { deleteCategory, updateCategory } from "@/actions/CategoryActions";

// Public Objects ------------------------------------------------------------

type RouteContext = {
  params: Promise<{ categoryId: string }>;
};

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  void request;
  const { categoryId } = await params;
  const result = await deleteCategory(categoryId);
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
  const { categoryId } = await params;
  const data: CategoryUpdateSchemaType = await request.json();
  const result = await updateCategory(categoryId, data);
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

