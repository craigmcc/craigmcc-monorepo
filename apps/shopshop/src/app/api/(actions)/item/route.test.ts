/**
 * E2E tests for the Item create route.
 */

// External Imports ----------------------------------------------------------

import { ERRORS } from "@repo/daisy-form/ActionResult";
import { MemberRole } from "@repo/db-shopshop";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

// Internal Imports ----------------------------------------------------------

import { POST } from "@/app/api/(actions)/item/route";
import { lookupCategoryByRole } from "@/lib/CategoryHelpers";
import { lookupProfileByEmail } from "@/lib/ProfileHelpers";
import { setProfile } from "@/lib/ProfileServerHelper";
import { BaseUtils } from "@/test/BaseUtils";
import { PROFILES } from "@/test/SeedData";

// Public Objects ------------------------------------------------------------

describe("/api/item", () => {

  // Test Hooks --------------------------------------------------------------

  const utils = new BaseUtils();

  beforeEach(async () => {
    setProfile(null);
    await utils.loadData({
      withCategories: true,
      withLists: true,
      withMembers: true,
      withProfiles: true,
    });
  });

  // Test Cases --------------------------------------------------------------

  it("returns an authentication error for unsigned callers", async () => {
    const profile = await lookupProfileByEmail(PROFILES[0]!.email!);
    const category = await lookupCategoryByRole(profile!, MemberRole.GUEST);
    const request = new NextRequest("http://example.test/api/item", {
      body: JSON.stringify({
        categoryId: category!.id,
        listId: category!.listId,
        name: "Route Item",
      }),
      method: "POST",
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe(ERRORS.AUTHENTICATION);
    expect(payload.status).toBe(401);
  });

  it("creates an item for a signed-in member", async () => {
    const profile = await lookupProfileByEmail(PROFILES[0]!.email!);
    const category = await lookupCategoryByRole(profile!, MemberRole.GUEST);
    setProfile(profile);
    const request = new NextRequest("http://example.test/api/item", {
      body: JSON.stringify({
        categoryId: category!.id,
        listId: category!.listId,
        name: "Route Item",
      }),
      method: "POST",
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.categoryId).toBe(category!.id);
    expect(payload.data.listId).toBe(category!.listId);
    expect(payload.data.name).toBe("Route Item");
  });

});

// Private Objects -----------------------------------------------------------

