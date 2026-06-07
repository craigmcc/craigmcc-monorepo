/**
 * Server side actions that perform mutations on Profile models.
 *
 * This module varies from the typical pattern in two respects:
 * - No createProfile or deleteProfile functions.  Creating a Profile
 *   happens during the sign-up process, and deleting a Profile is
 *   not currently supported.
 * - Updating a Profile also updates the corresponding User (in the
 *   tables related to better-auth).
 */

// External Imports ----------------------------------------------------------

import {
  ActionResult,
  ERRORS,
  ValidationActionResult
} from "@repo/daisy-form/ActionResult";
import { dbShopShop, Profile } from "@repo/db-shopshop";
import {
  ProfileUpdateSchema,
  ProfileUpdateSchemaType,
} from "@repo/db-shopshop/zod-schemas/ProfileSchema";
import { serverLogger as logger } from "@repo/shared-utils/ServerLogger";

// Internal Imports ----------------------------------------------------------

import { findProfile } from "@/lib/ProfileServerHelper";

// Public Objects ------------------------------------------------------------

export async function updateProfile(data: ProfileUpdateSchemaType): Promise<ActionResult<Profile>> {

  try {

    // AUTHENTICATION - Must be signed in
    const profile = await findProfile();
    if (!profile) {
      return ({ message: ERRORS.AUTHENTICATION, status: 401 });
    }

    // AUTHORIZATION - Can only update own profile, so no check required

    // VALIDATION - Validate input content
    const result =  ProfileUpdateSchema.safeParse(data);
    if (!result.success) {
      logger.error({
        context: "ProfileActions.updateProfile",
        data,
        issues: result.error.issues,
      });
      return ValidationActionResult<Profile>(result.error);
    }

    // VALIDATION - Check for uniqueness constraint violation
    if (data.email) {
      const existing = await dbShopShop.profile.findUnique({
        where: {
          email: data.email,
          NOT: {
            id: profile.id,
          }
        },
      });
      if (existing) {
        return ({ message: "That email address is already in use", status: 409 });
      }
    }

    // MUTATION - Update the Profile and the corresponding User
    const updated = await dbShopShop.profile.update({
      data,
      where: { id: profile.id }
    });
    await dbShopShop.user.update({
      data,
      where: { email: profile.email },
    });

    return ({ model: updated });

  } catch (error) {
    logger.error({
      context: "ProfileActions.updateProfile",
      error,
      message: "Unexpected error updating Profile",
    });
    return ({ message: ERRORS.INTERNAL_SERVER_ERROR, status: 500 });
  }

}

// Private Objects -----------------------------------------------------------

