/**
 * Route handler for List create mutations.
 */

// External Imports ----------------------------------------------------------

import { ListCreateSchemaType } from "@repo/db-shopshop/zod-schemas/ListSchema";
import { NextRequest, NextResponse } from "next/server";

// Internal Imports ----------------------------------------------------------

import { createList } from "@/actions/ListActions";

// Public Objects ------------------------------------------------------------

export async function POST(request: NextRequest) {
  const data: ListCreateSchemaType = await request.json();
  const result = await createList(data);
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

