/**
 * Better-Auth server side configuration.
 */

// External Modules ----------------------------------------------------------

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { customSession } from "better-auth/plugins";

// Internal Modules ---------------------------------------------------------

import { dbShopShop, Profile } from "@repo/db-shopshop"

// Public Objects -----------------------------------------------------------

type SessionProfileCacheEntry = {
  expiresAt: number;
  profile: Profile | null;
};

const PROFILE_CACHE_TTL_MS = 60_000;
const MAX_PROFILE_CACHE_ENTRIES = 5_000;
const sessionProfileCache = new Map<string, SessionProfileCacheEntry>();

export function invalidateSessionProfileCacheByEmail(email: string): void {
  const cacheKey = makeSessionProfileCacheKey(email);
  sessionProfileCache.delete(cacheKey);
}

export const auth = betterAuth({
  database: prismaAdapter(dbShopShop, {
    provider: "postgresql",
  }),
  plugins: [
    customSession(async ({ session, user }) => {
      const profile = await getCachedSessionProfile(user.email);

      return {
        session,
        user,
        profile,
      };
    }),
  ],
  emailAndPassword: {
    enabled: true
  }
});

// Private Objects -----------------------------------------------------------

async function getCachedSessionProfile(email: string): Promise<Profile | null> {
  const cacheKey = makeSessionProfileCacheKey(email);
  const now = Date.now();
  const cachedEntry = sessionProfileCache.get(cacheKey);

  if (cachedEntry && cachedEntry.expiresAt > now) {
    return cachedEntry.profile ? { ...cachedEntry.profile } : null;
  }

  if (cachedEntry) {
    sessionProfileCache.delete(cacheKey);
  }

  const profile = await dbShopShop.profile.findUnique({
    where: { email },
  });

  ensureSessionProfileCacheCapacity();

  sessionProfileCache.set(cacheKey, {
    expiresAt: now + PROFILE_CACHE_TTL_MS,
    profile,
  });

  return profile;
}

function makeSessionProfileCacheKey(email: string): string {
  return email.trim().toLowerCase();
}

// Note: the eviction branch below (size >= MAX_PROFILE_CACHE_ENTRIES) is not
// covered by tests because reaching 5,000 entries would require the app to
// have over 5,000 concurrent active users — a scenario that is not expected.
function ensureSessionProfileCacheCapacity(): void {
  if (sessionProfileCache.size < MAX_PROFILE_CACHE_ENTRIES) {
    return;
  }

  const oldestKey = sessionProfileCache.keys().next().value;
  if (oldestKey) {
    sessionProfileCache.delete(oldestKey);
  }
}

