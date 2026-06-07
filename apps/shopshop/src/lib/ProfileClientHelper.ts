"use client";

/**
 * Helpers for reading the authenticated profile in client-side code.
 */

// External Imports ----------------------------------------------------------

import type { Profile } from "@repo/db-shopshop/types";

// Internal Imports ----------------------------------------------------------

import { useSession } from "@/auth/auth-client";

// Public Objects ------------------------------------------------------------

/**
 * Set the profile value used by `useProfile` during tests.
 */
export function setProfile(profile: Profile | null): void {
  if (!isTestMode()) {
    throw new Error("setProfile can only be used in test mode");
  }
  testProfile = profile;
}

/**
 * Client-side profile lookup for React components.
 */
export function useProfile(): Profile | null {
  if (isTestMode()) {
    return testProfile;
  }

  const { data: session } = sessionReader();
  return session?.profile ?? null;
}

// Private Objects -----------------------------------------------------------

let testProfile: Profile | null = null;

const sessionReader = isTestMode() ? readTestSession : useSession;

function isTestMode(): boolean {
  return process.env.NODE_ENV === "test" || process.env.VITEST === "true";
}

function readTestSession() {
  return { data: undefined };
}








