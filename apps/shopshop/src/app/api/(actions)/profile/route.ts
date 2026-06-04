/**
 * Route handler for Profile mutations.
 */

// External Imports ----------------------------------------------------------

import { ProfileUpdateSchemaType } from "@repo/db-shopshop/zod-schemas/ProfileSchema";
import { NextRequest, NextResponse } from "next/server";

// Internal Imports ----------------------------------------------------------

import { updateProfile } from "@/actions/ProfileActions";

// Public Objects ------------------------------------------------------------

export async function PUT(request: NextRequest) {
  const data: ProfileUpdateSchemaType = await request.json();
  const result = await updateProfile(data);
  if (result.model) {
    return NextResponse.json({
      data: result.model,
      success: true,
    });
  } else {
    return NextResponse.json({
      error: result.message,
      status: 400, // TODO: figure out what status to return without parsing the message
    });
  }
}

// Private Objects -----------------------------------------------------------

