/**
 * E2E tests for the List create route.
 */

// External Imports ----------------------------------------------------------

import { ERRORS } from "@repo/daisy-form/ActionResult";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

// Internal Imports ----------------------------------------------------------

import { POST } from "@/app/api/(actions)/list/route";
import { lookupProfileByEmail } from "@/lib/ProfileHelpers";
import { setProfile } from "@/lib/ProfileServerHelper";
import { BaseUtils } from "@/test/BaseUtils";
import { PROFILES } from "@/test/SeedData";

// Public Objects ------------------------------------------------------------

describe("/api/list", () => {

  // Test Hooks --------------------------------------------------------------

  const utils = new BaseUtils();

  beforeEach(async () => {
    setProfile(null);
    await utils.loadData({
      withProfiles: true,
    });
  });

  // Test Cases --------------------------------------------------------------

  it("returns an authentication error for unsigned callers", async () => {
    const request = new NextRequest("http://example.test/api/list", {
      body: JSON.stringify({
        name: "Route List",
      }),
      method: "POST",
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe(ERRORS.AUTHENTICATION);
    expect(payload.status).toBe(401);
  });

  it("creates a list for signed-in callers", async () => {
    const profile = await lookupProfileByEmail(PROFILES[0]!.email!);
    setProfile(profile);
    const request = new NextRequest("http://example.test/api/list", {
      body: JSON.stringify({
        name: "Route List",
      }),
      method: "POST",
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.name).toBe("Route List");
  });

});

// Private Objects -----------------------------------------------------------

