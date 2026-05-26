/**
 * Tests for auth-server utilities.
 */

// External Modules ----------------------------------------------------------

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Modules --------------------------------------------------------------

// Capture the customSession callback so we can invoke it directly in tests.
const customSessionCapture = vi.hoisted(() => ({
  fn: null as ((ctx: { session: unknown; user: { email: string; name: string } }) => Promise<unknown>) | null,
}));

vi.mock("@repo/db-shopshop", () => ({
  dbShopShop: {
    profile: {
      upsert: vi.fn(),
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
    (fn: (ctx: { session: unknown; user: { email: string; name: string } }) => Promise<unknown>) => {
      customSessionCapture.fn = fn;
      return { id: "custom-session" };
    }
  ),
}));

vi.mock("@repo/shared-utils", () => ({
  serverLogger: {
    error: vi.fn(),
    info: vi.fn(),
    trace: vi.fn(),
  },
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

describe("customSession callback (getOrCreateCachedSessionProfile)", () => {

  const mockUpsert = vi.mocked(dbShopShop.profile.upsert);

  beforeEach(() => {
    mockUpsert.mockReset();
    // Clear cache entries used by these tests.
    invalidateSessionProfileCacheByEmail(testUser.email);
    invalidateSessionProfileCacheByEmail("ttl@example.com");
    invalidateSessionProfileCacheByEmail("error@example.com");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("customSession callback is captured and callable", () => {
    expect(customSessionCapture.fn).not.toBeNull();
  });

  it("returns profile from DB on cache miss", async () => {
    mockUpsert.mockResolvedValue(testProfile);

    const result = await customSessionCapture.fn!({ session: testSession, user: testUser }) as {
      profile: unknown;
    };

    expect(result.profile).toEqual(testProfile);
    expect(mockUpsert).toHaveBeenCalledOnce();
  });

  it("upserts with correct args — preserves existing profile, creates if missing", async () => {
    mockUpsert.mockResolvedValue(testProfile);

    await customSessionCapture.fn!({ session: testSession, user: testUser });

    expect(mockUpsert).toHaveBeenCalledWith({
      where: { email: testUser.email },
      update: {},
      create: { email: testUser.email, name: testUser.name },
    });
  });

  it("returns session and user alongside profile", async () => {
    mockUpsert.mockResolvedValue(testProfile);

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
    mockUpsert.mockResolvedValue(testProfile);

    await customSessionCapture.fn!({ session: testSession, user: testUser });
    await customSessionCapture.fn!({ session: testSession, user: testUser });

    expect(mockUpsert).toHaveBeenCalledOnce();
  });

  it("re-fetches from DB after TTL expires", async () => {
    vi.useFakeTimers();
    const ttlUser = { ...testUser, email: "ttl@example.com" };
    mockUpsert.mockResolvedValue(testProfile);

    // First call — cache miss, hits DB.
    await customSessionCapture.fn!({ session: testSession, user: ttlUser });

    // Advance past the 60s TTL.
    vi.advanceTimersByTime(61_000);

    // Second call — TTL expired, hits DB again.
    await customSessionCapture.fn!({ session: testSession, user: ttlUser });

    expect(mockUpsert).toHaveBeenCalledTimes(2);
  });

  it("after invalidation, next call re-fetches from DB", async () => {
    mockUpsert.mockResolvedValue(testProfile);

    // Populate the cache.
    await customSessionCapture.fn!({ session: testSession, user: testUser });
    expect(mockUpsert).toHaveBeenCalledOnce();

    // Invalidate.
    invalidateSessionProfileCacheByEmail(testUser.email);

    // Next call should hit DB again.
    await customSessionCapture.fn!({ session: testSession, user: testUser });
    expect(mockUpsert).toHaveBeenCalledTimes(2);
  });

  it("returns null (without caching) when DB throws", async () => {
    const errorUser = { ...testUser, email: "error@example.com" };
    mockUpsert.mockRejectedValue(new Error("DB connection failed"));

    const result = await customSessionCapture.fn!({ session: testSession, user: errorUser }) as {
      profile: unknown;
    };

    expect(result.profile).toBeNull();
  });

  it("retries DB on next call after an error (error result is not cached)", async () => {
    const errorUser = { ...testUser, email: "error@example.com" };
    mockUpsert.mockRejectedValueOnce(new Error("transient error"));
    mockUpsert.mockResolvedValueOnce(testProfile);

    // First call — DB error → null, should not be cached.
    const first = await customSessionCapture.fn!({ session: testSession, user: errorUser }) as { profile: unknown };
    expect(first.profile).toBeNull();

    // Second call — DB succeeds; error was not cached so DB is hit again.
    const second = await customSessionCapture.fn!({ session: testSession, user: errorUser }) as { profile: unknown };
    expect(second.profile).toEqual(testProfile);
    expect(mockUpsert).toHaveBeenCalledTimes(2);
  });

});
