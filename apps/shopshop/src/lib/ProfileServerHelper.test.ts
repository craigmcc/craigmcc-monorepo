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
  const requestHeaders = new Headers({ cookie: "session=abc123" });

  const sessionProfile = {
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    email: "session@example.com",
    id: "profile-session",
    imageUrl: null,
    name: "Session User",
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

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
    mockGetSession.mockReset();
    mockHeaders.mockReset();
    mockHeaders.mockResolvedValue(requestHeaders);
  });

  it("findProfile returns null when setProfile(null) is used in test mode", async () => {
    setProfile(null);

    const profile = await findProfile();

    expect(profile).toBeNull();
    expect(mockHeaders).not.toHaveBeenCalled();
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it("findProfile returns setProfile(profile) value in test mode", async () => {
    setProfile(overrideProfile);

    const profile = await findProfile();

    expect(profile).toEqual(overrideProfile);
    expect(mockHeaders).not.toHaveBeenCalled();
    expect(mockGetSession).not.toHaveBeenCalled();
  });

});


