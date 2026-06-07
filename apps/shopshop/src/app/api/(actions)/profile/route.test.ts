/**
 * E2E tests for the Profile action route.
 */

// External Imports ----------------------------------------------------------

import { ERRORS } from "@repo/daisy-form/ActionResult";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

// Internal Imports ----------------------------------------------------------

import { PUT } from "@/app/api/(actions)/profile/route";
import { lookupProfileByEmail } from "@/lib/ProfileHelpers";
import { setProfile } from "@/lib/ProfileServerHelper";
import { BaseUtils } from "@/test/BaseUtils";
import { PROFILES } from "@/test/SeedData";

// Public Objects ------------------------------------------------------------

describe("/api/profile", () => {

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
    const request = new NextRequest("http://example.test/api/profile", {
      body: JSON.stringify({}),
      method: "PUT",
    });

    const response = await PUT(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe(ERRORS.AUTHENTICATION);
    expect(payload.status).toBe(401);
  });

  it("updates the signed-in profile", async () => {
    const profile = await lookupProfileByEmail(PROFILES[0]!.email!);
    setProfile(profile);
    const request = new NextRequest("http://example.test/api/profile", {
      body: JSON.stringify({
        name: "Updated Name From Route",
      }),
      method: "PUT",
    });

    const response = await PUT(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.id).toBe(profile!.id);
    expect(payload.data.name).toBe("Updated Name From Route");
  });

});

// Private Objects -----------------------------------------------------------
