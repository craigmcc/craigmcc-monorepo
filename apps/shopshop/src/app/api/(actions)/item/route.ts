/**
 * Route handler for Item create mutations.
 */

// External Imports ----------------------------------------------------------

import { ItemCreateSchemaType } from "@repo/db-shopshop/zod-schemas/ItemSchema";
import { NextRequest, NextResponse } from "next/server";

// Internal Imports ----------------------------------------------------------

import { createItem } from "@/actions/ItemActions";

// Public Objects ------------------------------------------------------------

export async function POST(request: NextRequest) {
  const data: ItemCreateSchemaType = await request.json();
  const result = await createItem(data);
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

