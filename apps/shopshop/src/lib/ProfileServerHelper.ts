/**
 * Helpers for reading the authenticated profile in server-side code.
 */

// External Imports ----------------------------------------------------------

import type { Profile } from "@repo/db-shopshop/types";
import { headers } from "next/headers";

// Internal Imports ----------------------------------------------------------

import { auth } from "@/auth/auth-server";

// Public Objects ------------------------------------------------------------

/**
 * Async profile lookup for server actions and other server-side code.
 */
export async function findProfile(): Promise<Profile | null> {
  if (isTestMode()) {
    return testProfile;
  }

  const requestHeaders = await headers();
  const sessionResult = await auth.api.getSession({ headers: requestHeaders });
  return sessionResult?.profile ?? null;
}

/**
 * Set the profile value used by `findProfile` during tests.
 */
export function setProfile(profile: Profile | null): void {
  if (!isTestMode()) {
    throw new Error("setProfile can only be used in test mode");
  }
  testProfile = profile;
}

// Private Objects -----------------------------------------------------------

let testProfile: Profile | null = null;

function isTestMode(): boolean {
  return process.env.NODE_ENV === "test" || process.env.VITEST === "true";
}


