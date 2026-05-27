/**
 * Tests for profile helper functions.
 */

// External Imports ----------------------------------------------------------

import { beforeEach, describe, expect, it } from "vitest";

// Internal Imports ----------------------------------------------------------

import {
  setProfile,
  useProfile,
} from "@/lib/ProfileClientHelper";

// Public Objects ------------------------------------------------------------

describe("ProfileClientHelper", () => {
  const overrideProfile = {
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    email: "override@example.com",
    id: "profile-override",
    imageUrl: null,
    name: "Override User",
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  };

  beforeEach(() => {
    setProfile(null);
  });

  it("useProfile returns the override profile in test mode", () => {
    setProfile(overrideProfile);

    const profile = useProfile();

    expect(profile).toEqual(overrideProfile);
  });
});
