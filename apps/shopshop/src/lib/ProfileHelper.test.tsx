/**
 * Tests for profile helper functions.
 */

// External Imports ----------------------------------------------------------

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Modules --------------------------------------------------------------

const { mockUseSession } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
}));

vi.mock("@/auth/auth-client", () => ({
  useSession: mockUseSession,
}));

// Internal Imports ----------------------------------------------------------

import {
  setProfile,
  useProfile,
} from "@/lib/ProfileHelper";

// Public Objects ------------------------------------------------------------

describe("ProfileHelper", () => {

  const defaultSessionProfile = {
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
    mockUseSession.mockReset();
    mockUseSession.mockReturnValue({ data: { profile: defaultSessionProfile } });
  });

  it("useProfile returns the test override profile in test mode", () => {
    setProfile(overrideProfile);

    const profile = useProfile();

    expect(profile).toEqual(overrideProfile);
  });

});












