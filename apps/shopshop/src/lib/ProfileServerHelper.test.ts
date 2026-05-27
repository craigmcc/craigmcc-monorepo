/**
 * Tests for server-side profile helper functions.
 */

// External Imports ----------------------------------------------------------

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Modules --------------------------------------------------------------

const { mockGetSession, mockHeaders } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockHeaders: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

vi.mock("@/auth/auth-server", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

// Internal Imports ----------------------------------------------------------

import { findProfile, setProfile } from "@/lib/ProfileServerHelper";

// Public Objects ------------------------------------------------------------

describe("ProfileServerHelper", () => {
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

  it("findProfile returns null when the profile is cleared in test mode", async () => {
    const profile = await findProfile();

    expect(profile).toBeNull();
  });

  it("findProfile returns setProfile(profile) value in test mode", async () => {
    setProfile(overrideProfile);

    const profile = await findProfile();

    expect(profile).toEqual(overrideProfile);
  });

});

