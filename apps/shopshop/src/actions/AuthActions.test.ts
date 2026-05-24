/**
 * Tests for AuthActions server actions.
 */

// External Modules ----------------------------------------------------------

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Modules --------------------------------------------------------------

// vi.hoisted ensures these are available when vi.mock factories run.
const {
  mockFindUnique,
  mockInvalidateCache,
  mockSignInEmail,
  mockSignOut,
  mockSignUpEmail,
  mockUpsert,
} = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockInvalidateCache: vi.fn(),
  mockSignInEmail: vi.fn(),
  mockSignOut: vi.fn(),
  mockSignUpEmail: vi.fn(),
  mockUpsert: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@repo/shared-utils/ServerLogger", () => ({
  serverLogger: {
    error: vi.fn(),
    info: vi.fn(),
    trace: vi.fn(),
  },
}));

vi.mock("@repo/db-shopshop", () => ({
  dbShopShop: {
    profile: {
      findUnique: mockFindUnique,
      upsert: mockUpsert,
    },
  },
}));

vi.mock("@/auth/auth-server", () => ({
  auth: {
    api: {
      signInEmail: mockSignInEmail,
      signOut: mockSignOut,
      signUpEmail: mockSignUpEmail,
    },
  },
  invalidateSessionProfileCacheByEmail: mockInvalidateCache,
}));

// Internal Modules ----------------------------------------------------------

import { doSignInAction, doSignOutAction, doSignUpAction } from "./AuthActions";

// Test Fixtures -------------------------------------------------------------

const testProfile = {
  id: "profile-123",
  email: "test@example.com",
  name: "Test User",
  imageUrl: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  members: [],
};

const signInFormData = {
  email: "test@example.com",
  password: "password123",
};

const signUpFormData = {
  email: "test@example.com",
  name: "Test User",
  password: "password123",
  confirmPassword: "password123",
};

// Tests ---------------------------------------------------------------------

describe("doSignInAction", () => {

  beforeEach(() => {
    mockSignInEmail.mockResolvedValue(undefined);
    mockFindUnique.mockResolvedValue(testProfile);
  });

  it("returns profile on successful sign-in", async () => {
    const result = await doSignInAction(signInFormData);

    expect(result.message).toBeUndefined();
    expect(result.model).toEqual(testProfile);
  });

  it("calls auth.api.signInEmail with email and password", async () => {
    await doSignInAction(signInFormData);

    expect(mockSignInEmail).toHaveBeenCalledWith(expect.objectContaining({
      body: {
        email: signInFormData.email,
        password: signInFormData.password,
      },
    }));
  });

  it("looks up profile by email after successful sign-in", async () => {
    await doSignInAction(signInFormData);

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { email: signInFormData.email },
    });
  });

  it("returns error message when profile is not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await doSignInAction(signInFormData);

    expect(result.message).toBe("Profile not found for this email address");
    expect(result.model).toBeUndefined();
  });

  it("returns error message when auth sign-in throws", async () => {
    mockSignInEmail.mockRejectedValue(new Error("Invalid credentials"));

    const result = await doSignInAction(signInFormData);

    expect(result.message).toBe("Invalid credentials");
    expect(result.model).toBeUndefined();
  });

  it("returns fallback message when auth throws non-Error", async () => {
    mockSignInEmail.mockRejectedValue("unexpected");

    const result = await doSignInAction(signInFormData);

    expect(result.message).toBe("Sign in failed");
  });

  it("returns error message when profile lookup throws", async () => {
    mockFindUnique.mockRejectedValue(new Error("DB error"));

    const result = await doSignInAction(signInFormData);

    // Profile lookup error causes getProfileByEmail to return null
    expect(result.message).toBe("Profile not found for this email address");
  });

});

describe("doSignUpAction", () => {

  beforeEach(() => {
    mockSignUpEmail.mockResolvedValue(undefined);
    mockUpsert.mockResolvedValue(testProfile);
  });

  it("returns profile on successful sign-up", async () => {
    const result = await doSignUpAction(signUpFormData);

    expect(result.message).toBeUndefined();
    expect(result.model).toEqual(testProfile);
  });

  it("calls auth.api.signUpEmail with email, password and name", async () => {
    await doSignUpAction(signUpFormData);

    expect(mockSignUpEmail).toHaveBeenCalledWith(expect.objectContaining({
      body: {
        email: signUpFormData.email,
        password: signUpFormData.password,
        name: signUpFormData.name,
      },
    }));
  });

  it("upserts profile after successful auth sign-up", async () => {
    await doSignUpAction(signUpFormData);

    expect(mockUpsert).toHaveBeenCalledWith({
      where: { email: signUpFormData.email },
      update: { name: signUpFormData.name },
      create: { email: signUpFormData.email, name: signUpFormData.name },
    });
  });

  it("invalidates session profile cache after upsert", async () => {
    await doSignUpAction(signUpFormData);

    expect(mockInvalidateCache).toHaveBeenCalledWith(signUpFormData.email);
  });

  it("returns error message when profile upsert fails", async () => {
    mockUpsert.mockResolvedValue(null);

    const result = await doSignUpAction(signUpFormData);

    expect(result.message).toBe(
      "Account created but profile setup failed. Please contact support."
    );
    expect(result.model).toBeUndefined();
  });

  it("returns error message when auth sign-up throws", async () => {
    mockSignUpEmail.mockRejectedValue(new Error("Email already in use"));

    const result = await doSignUpAction(signUpFormData);

    expect(result.message).toBe("Email already in use");
    expect(result.model).toBeUndefined();
  });

  it("returns fallback message when auth throws non-Error", async () => {
    mockSignUpEmail.mockRejectedValue("unexpected");

    const result = await doSignUpAction(signUpFormData);

    expect(result.message).toBe("Sign up failed");
  });

  it("does not invalidate cache when auth sign-up throws", async () => {
    mockSignUpEmail.mockRejectedValue(new Error("Auth failed"));

    await doSignUpAction(signUpFormData);

    expect(mockInvalidateCache).not.toHaveBeenCalled();
  });

});

describe("doSignOutAction", () => {

  beforeEach(() => {
    mockSignOut.mockResolvedValue(undefined);
  });

  it("returns success result on sign-out", async () => {
    const result = await doSignOutAction();

    expect(result.message).toBeUndefined();
    expect(result.model).toBeUndefined();
  });

  it("calls auth.api.signOut with headers", async () => {
    await doSignOutAction();

    expect(mockSignOut).toHaveBeenCalledWith(expect.objectContaining({
      headers: expect.any(Headers),
    }));
  });

  it("returns error message when sign-out throws", async () => {
    mockSignOut.mockRejectedValue(new Error("Session expired"));

    const result = await doSignOutAction();

    expect(result.message).toBe("Session expired");
  });

  it("returns fallback message when sign-out throws non-Error", async () => {
    mockSignOut.mockRejectedValue("unexpected");

    const result = await doSignOutAction();

    expect(result.message).toBe("Sign out failed");
  });

});


