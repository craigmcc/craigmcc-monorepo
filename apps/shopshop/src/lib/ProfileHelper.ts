"use client";

/**
 * Helpers for reading the authenticated Profile in client-side code.
 */

// External Imports ----------------------------------------------------------

import { Profile } from "@repo/db-shopshop";

// Internal Imports ----------------------------------------------------------

import { useSession } from "@/auth/auth-client";

// Public Objects ------------------------------------------------------------

/**
 * Set the profile value used by useProfile during tests.
 */
export function setProfile(profile: Profile | null): void {
  if (!isTestMode()) {
    throw new Error("setProfile can only be used in test mode");
  }
  testProfile = profile;
}

/**
 * Render-time profile lookup for React client components.
 */
export function useProfile(): Profile | null {
  if (isTestMode()) {
    return testProfile;
  }

  const { data: session } = useSession();
  return session?.profile ?? null;
}

// Private Objects -----------------------------------------------------------

let testProfile: Profile | null = null;

function isTestMode(): boolean {
  return process.env.NODE_ENV === "test" || process.env.VITEST === "true";
}








