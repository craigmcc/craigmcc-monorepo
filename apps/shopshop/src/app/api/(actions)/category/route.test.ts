/**
 * E2E tests for the Category create route.
 */

// External Imports ----------------------------------------------------------

import { ERRORS } from "@repo/daisy-form/ActionResult";
import { MemberRole } from "@repo/db-shopshop/enums";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

// Internal Imports ----------------------------------------------------------

import { POST } from "@/app/api/(actions)/category/route";
import { lookupListByRole } from "@/lib/ListHelpers";
import { lookupProfileByEmail } from "@/lib/ProfileHelpers";
import { setProfile } from "@/lib/ProfileServerHelper";
import { BaseUtils } from "@/test/BaseUtils";
import { PROFILES } from "@/test/SeedData";

// Public Objects ------------------------------------------------------------

describe("/api/category", () => {

  // Test Hooks --------------------------------------------------------------

  const utils = new BaseUtils();

  beforeEach(async () => {
    setProfile(null);
    await utils.loadData({
      withLists: true,
      withMembers: true,
      withProfiles: true,
    });
  });

  // Test Cases --------------------------------------------------------------

  it("returns an authentication error for unsigned callers", async () => {
    const profile = await lookupProfileByEmail(PROFILES[0]!.email!);
    const list = await lookupListByRole(profile!, MemberRole.GUEST);
    const request = new NextRequest("http://example.test/api/category", {
      body: JSON.stringify({
        listId: list!.id,
        name: "Route Category",
      }),
      method: "POST",
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe(ERRORS.AUTHENTICATION);
    expect(payload.status).toBe(401);
  });

  it("creates a category for a signed-in member", async () => {
    const profile = await lookupProfileByEmail(PROFILES[0]!.email!);
    const list = await lookupListByRole(profile!, MemberRole.GUEST);
    setProfile(profile);
    const request = new NextRequest("http://example.test/api/category", {
      body: JSON.stringify({
        listId: list!.id,
        name: "Route Category",
      }),
      method: "POST",
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.listId).toBe(list!.id);
    expect(payload.data.name).toBe("Route Category");
  });

});

// Private Objects -----------------------------------------------------------

