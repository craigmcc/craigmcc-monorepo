/**
 * Helpers for looking up Profile models.
 */

// External Imports ----------------------------------------------------------

import { dbShopShop as db, Profile } from "@repo/db-shopshop";

// Public Objects ------------------------------------------------------------

/**
 * Look up and return the Profile with the specified email address.
 */
export async function lookupProfileByEmail(email: string): Promise<Profile | null> {
  return db.profile.findUnique({
    where: {
      email,
    },
  });
}

