/**
 * Route handler for Category create mutations.
 */

// External Imports ----------------------------------------------------------

import { CategoryCreateSchemaType } from "@repo/db-shopshop/zod-schemas/CategorySchema";
import { NextRequest, NextResponse } from "next/server";

// Internal Imports ----------------------------------------------------------

import { createCategory } from "@/actions/CategoryActions";

// Public Objects ------------------------------------------------------------

export async function POST(request: NextRequest) {
  const data: CategoryCreateSchemaType = await request.json();
  const result = await createCategory(data);
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

