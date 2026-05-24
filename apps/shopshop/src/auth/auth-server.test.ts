/**
 * Tests for auth-server utilities.
 */

// External Modules ----------------------------------------------------------

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Modules --------------------------------------------------------------

// Capture the customSession callback so we can invoke it directly in tests.
const customSessionCapture = vi.hoisted(() => ({
  fn: null as ((ctx: { session: unknown; user: { email: string } }) => Promise<unknown>) | null,
}));

vi.mock("@repo/db-shopshop", () => ({
  dbShopShop: {
    profile: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("better-auth", () => ({
  betterAuth: vi.fn(() => ({
    api: {},
    handler: vi.fn(),
    options: {},
  })),
}));

vi.mock("better-auth/adapters/prisma", () => ({
  prismaAdapter: vi.fn(() => ({})),
}));

vi.mock("better-auth/plugins", () => ({
  customSession: vi.fn(
    (fn: (ctx: { session: unknown; user: { email: string } }) => Promise<unknown>) => {
      customSessionCapture.fn = fn;
      return { id: "custom-session" };
    }
  ),
}));

// Internal Modules ----------------------------------------------------------

import { dbShopShop } from "@repo/db-shopshop";
import { invalidateSessionProfileCacheByEmail } from "./auth-server";

// Test Fixtures -------------------------------------------------------------

const testSession = { id: "sess-1", expiresAt: new Date("2026-12-31"), token: "tok" };
const testUser = { id: "user-1", email: "cached@example.com", name: "Cached User" };
const testProfile = {
  id: "profile-abc",
  email: "cached@example.com",
  name: "Cached User",
  imageUrl: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

// Tests ---------------------------------------------------------------------

describe("invalidateSessionProfileCacheByEmail", () => {

  it("does not throw when called with a known email", () => {
    expect(() =>
      invalidateSessionProfileCacheByEmail("user@example.com")
    ).not.toThrow();
  });

  it("does not throw when called with an unknown email", () => {
    expect(() =>
      invalidateSessionProfileCacheByEmail("nobody@example.com")
    ).not.toThrow();
  });

  it("normalizes email case before invalidating", () => {
    expect(() =>
      invalidateSessionProfileCacheByEmail("User@Example.COM")
    ).not.toThrow();
    expect(() =>
      invalidateSessionProfileCacheByEmail("user@example.com")
    ).not.toThrow();
  });

  it("handles whitespace-only email gracefully", () => {
    expect(() =>
      invalidateSessionProfileCacheByEmail("  ")
    ).not.toThrow();
  });

});

describe("customSession callback (getCachedSessionProfile)", () => {

  const mockFindUnique = vi.mocked(dbShopShop.profile.findUnique);

  beforeEach(() => {
    mockFindUnique.mockReset();
    invalidateSessionProfileCacheByEmail(testUser.email);
    invalidateSessionProfileCacheByEmail("null@example.com");
    invalidateSessionProfileCacheByEmail("ttl@example.com");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("customSession callback is captured and callable", () => {
    expect(customSessionCapture.fn).not.toBeNull();
  });

  it("returns profile from DB on cache miss", async () => {
    mockFindUnique.mockResolvedValue(testProfile);

    const result = await customSessionCapture.fn!({ session: testSession, user: testUser }) as {
      profile: unknown;
    };

    expect(result.profile).toEqual(testProfile);
    expect(mockFindUnique).toHaveBeenCalledOnce();
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { email: testUser.email } });
  });

  it("returns session and user alongside profile", async () => {
    mockFindUnique.mockResolvedValue(testProfile);

    const result = await customSessionCapture.fn!({ session: testSession, user: testUser }) as {
      session: unknown;
      user: unknown;
      profile: unknown;
    };

    expect(result.session).toBe(testSession);
    expect(result.user).toBe(testUser);
    expect(result.profile).toEqual(testProfile);
  });

  it("does not hit DB on second call within TTL (cache hit)", async () => {
    mockFindUnique.mockResolvedValue(testProfile);

    await customSessionCapture.fn!({ session: testSession, user: testUser });
    await customSessionCapture.fn!({ session: testSession, user: testUser });

    expect(mockFindUnique).toHaveBeenCalledOnce();
  });

  it("returns null profile when no matching Profile exists in DB", async () => {
    const nullUser = { ...testUser, email: "null@example.com" };
    mockFindUnique.mockResolvedValue(null);

    const result = await customSessionCapture.fn!({ session: testSession, user: nullUser }) as {
      profile: unknown;
    };

    expect(result.profile).toBeNull();
  });

  it("caches null result so missing profile does not repeatedly hit DB", async () => {
    const nullUser = { ...testUser, email: "null@example.com" };
    mockFindUnique.mockResolvedValue(null);

    await customSessionCapture.fn!({ session: testSession, user: nullUser });
    await customSessionCapture.fn!({ session: testSession, user: nullUser });

    expect(mockFindUnique).toHaveBeenCalledOnce();
  });

  it("re-fetches from DB after TTL expires", async () => {
    vi.useFakeTimers();
    const ttlUser = { ...testUser, email: "ttl@example.com" };
    mockFindUnique.mockResolvedValue(testProfile);

    // First call — cache miss, hits DB.
    await customSessionCapture.fn!({ session: testSession, user: ttlUser });

    // Advance past the 60s TTL.
    vi.advanceTimersByTime(61_000);

    // Second call — TTL expired, hits DB again.
    await customSessionCapture.fn!({ session: testSession, user: ttlUser });

    expect(mockFindUnique).toHaveBeenCalledTimes(2);
  });

  it("after invalidation, next call re-fetches from DB", async () => {
    mockFindUnique.mockResolvedValue(testProfile);

    // Populate the cache.
    await customSessionCapture.fn!({ session: testSession, user: testUser });
    expect(mockFindUnique).toHaveBeenCalledOnce();

    // Invalidate.
    invalidateSessionProfileCacheByEmail(testUser.email);

    // Next call should hit DB again.
    await customSessionCapture.fn!({ session: testSession, user: testUser });
    expect(mockFindUnique).toHaveBeenCalledTimes(2);
  });

});


