/**
 * Better-Auth server side configuration.
 */

// External Modules ----------------------------------------------------------

import { dbShopShop, Profile } from "@repo/db-shopshop"
import { serverLogger as logger } from "@repo/shared-utils";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { customSession } from "better-auth/plugins";

// Internal Modules ---------------------------------------------------------


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
      const profile = await getOrCreateCachedSessionProfile(user.email, user.name);
      logger.info({
        context: "auth-server:customSession",
        message: "Retrieved profile for session",
        profile,
      })
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

/**
 * Look up the user's Profile, creating it if it doesn't exist yet.
 * Results are cached per email for PROFILE_CACHE_TTL_MS to avoid a DB hit
 * on every getSession call.  Errors are NOT cached so transient failures
 * are automatically retried on the next request.
 */
async function getOrCreateCachedSessionProfile(email: string, name: string): Promise<Profile | null> {
  const cacheKey = makeSessionProfileCacheKey(email);
  const now = Date.now();
  const cachedEntry = sessionProfileCache.get(cacheKey);

  if (cachedEntry && cachedEntry.expiresAt > now) {
    return cachedEntry.profile ? { ...cachedEntry.profile } : null;
  }

  if (cachedEntry) {
    sessionProfileCache.delete(cacheKey);
  }

  try {
    // upsert: return the existing profile unchanged, or create one on first login.
    const profile = await dbShopShop.profile.upsert({
      where: { email },
      update: {},             // Never overwrite profile data from session
      create: { email, name },
    });

    ensureSessionProfileCacheCapacity();

    sessionProfileCache.set(cacheKey, {
      expiresAt: now + PROFILE_CACHE_TTL_MS,
      profile,
    });

    return profile;

  } catch (error) {
    logger.error({ context: "getOrCreateCachedSessionProfile", error, email });
    return null; // Don't cache errors — allow retry on next getSession call
  }
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

