/**
 * E2E tests for List update/delete routes.
 */

// External Imports ----------------------------------------------------------

import { ERRORS } from "@repo/daisy-form/ActionResult";
import { MemberRole } from "@repo/db-shopshop/enums";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

// Internal Imports ----------------------------------------------------------

import {
  DELETE,
  PUT,
} from "@/app/api/(actions)/list/[listId]/route";
import { lookupListByRole } from "@/lib/ListHelpers";
import { lookupProfileByEmail } from "@/lib/ProfileHelpers";
import { setProfile } from "@/lib/ProfileServerHelper";
import { BaseUtils } from "@/test/BaseUtils";
import { PROFILES } from "@/test/SeedData";

// Public Objects ------------------------------------------------------------

describe("/api/list/[listId]", () => {

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

  it("returns validation errors for invalid IDs", async () => {
    setProfile(await lookupProfileByEmail(PROFILES[0]!.email!));
    const request = new NextRequest("http://example.test/api/list/not-a-uuid", {
      body: JSON.stringify({
        name: "Updated Name",
      }),
      method: "PUT",
    });

    const response = await PUT(request, {
      params: Promise.resolve({ listId: "not-a-uuid" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe(ERRORS.ID_VALIDATION);
    expect(payload.status).toBe(400);
  });

  it("updates a list for an ADMIN member", async () => {
    const profile = await lookupProfileByEmail(PROFILES[1]!.email!);
    const list = await lookupListByRole(profile!, MemberRole.ADMIN);
    setProfile(profile);
    const request = new NextRequest(`http://example.test/api/list/${list!.id}`, {
      body: JSON.stringify({
        name: "Updated List From Route",
      }),
      method: "PUT",
    });

    const response = await PUT(request, {
      params: Promise.resolve({ listId: list!.id }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.id).toBe(list!.id);
    expect(payload.data.name).toBe("Updated List From Route");
  });

  it("deletes a list for an ADMIN member", async () => {
    const profile = await lookupProfileByEmail(PROFILES[1]!.email!);
    const list = await lookupListByRole(profile!, MemberRole.ADMIN);
    setProfile(profile);
    const request = new NextRequest(`http://example.test/api/list/${list!.id}`, {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ listId: list!.id }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.id).toBe(list!.id);
  });

});

// Private Objects -----------------------------------------------------------

