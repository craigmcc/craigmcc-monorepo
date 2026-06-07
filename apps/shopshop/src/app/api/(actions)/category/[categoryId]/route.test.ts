/**
 * E2E tests for Category update/delete routes.
 */

// External Imports ----------------------------------------------------------

import { ERRORS } from "@repo/daisy-form/ActionResult";
import { MemberRole } from "@repo/db-shopshop";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

// Internal Imports ----------------------------------------------------------

import {
  DELETE,
  PUT,
} from "@/app/api/(actions)/category/[categoryId]/route";
import { lookupCategoryByRole } from "@/lib/CategoryHelpers";
import { lookupProfileByEmail } from "@/lib/ProfileHelpers";
import { setProfile } from "@/lib/ProfileServerHelper";
import { BaseUtils } from "@/test/BaseUtils";
import { PROFILES } from "@/test/SeedData";

// Public Objects ------------------------------------------------------------

describe("/api/category/[categoryId]", () => {

  // Test Hooks --------------------------------------------------------------

  const utils = new BaseUtils();

  beforeEach(async () => {
    setProfile(null);
    await utils.loadData({
      withCategories: true,
      withItems: true,
      withLists: true,
      withMembers: true,
      withProfiles: true,
    });
  });

  // Test Cases --------------------------------------------------------------

  it("returns validation errors for invalid IDs", async () => {
    setProfile(await lookupProfileByEmail(PROFILES[0]!.email!));
    const request = new NextRequest("http://example.test/api/category/not-a-uuid", {
      body: JSON.stringify({
        name: "Updated Name",
      }),
      method: "PUT",
    });

    const response = await PUT(request, {
      params: Promise.resolve({ categoryId: "not-a-uuid" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe(ERRORS.ID_VALIDATION);
    expect(payload.status).toBe(400);
  });

  it("updates a category for a member", async () => {
    const profile = await lookupProfileByEmail(PROFILES[0]!.email!);
    const category = await lookupCategoryByRole(profile!, MemberRole.GUEST);
    setProfile(profile);
    const request = new NextRequest(`http://example.test/api/category/${category!.id}`, {
      body: JSON.stringify({
        name: "Updated Category From Route",
      }),
      method: "PUT",
    });

    const response = await PUT(request, {
      params: Promise.resolve({ categoryId: category!.id }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.id).toBe(category!.id);
    expect(payload.data.name).toBe("Updated Category From Route");
  });

  it("deletes a category for a member", async () => {
    const profile = await lookupProfileByEmail(PROFILES[0]!.email!);
    const category = await lookupCategoryByRole(profile!, MemberRole.GUEST);
    setProfile(profile);
    const request = new NextRequest(`http://example.test/api/category/${category!.id}`, {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ categoryId: category!.id }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.id).toBe(category!.id);
  });

});

// Private Objects -----------------------------------------------------------

