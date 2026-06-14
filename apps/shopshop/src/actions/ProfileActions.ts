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
  ValidationActionResult,
} from "@repo/daisy-form/ActionResult";
import { dbShopShop } from "@repo/db-shopshop";
import type { Profile } from "@repo/db-shopshop/types";
import {
  ProfileUpdateSchema,
  ProfileUpdateSchemaType,
} from "@repo/db-shopshop/zod-schemas/ProfileSchema";
import { serverLogger as logger } from "@repo/shared-utils/ServerLogger";

// Internal Imports ----------------------------------------------------------

import { executeIdempotentOperation } from "@/lib/ExecuteIdempotentOperation";
import { extractOperationId } from "@/lib/OperationIdempotencyHelpers";
import { findProfile } from "@/lib/ProfileServerHelper";
import {
  isPrismaRecordNotFoundError,
  isPrismaUniqueConstraintError,
} from "@/lib/PrismaErrorHelpers";

// Public Objects ------------------------------------------------------------

export async function updateProfile(data: ProfileUpdateSchemaType, operationEnvelope?: unknown): Promise<ActionResult<Profile>> {

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
        return ({ message: EMAIL_IN_USE_MESSAGE, status: 409 });
      }
    }

    const operationId = extractOperationId(operationEnvelope, "updateProfile");
    const mutateProfile = async (): Promise<ActionResult<Profile>> => {
      const updated = await dbShopShop.profile.update({
        data,
        where: { id: profile.id },
      });
      await dbShopShop.user.update({
        data,
        where: { email: profile.email },
      });

      return { model: updated };
    };

    if (!operationId) {
      return mutateProfile();
    }

    return executeIdempotentOperation<Profile>({
      actorProfileId: profile.id,
      operationId,
      operationType: "updateProfile",
      payload: data,
    }, mutateProfile);

  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      logger.warn({
        context: "ProfileActions.updateProfile",
        error,
        message: "Profile update hit unique constraint",
      });
      return ({ message: EMAIL_IN_USE_MESSAGE, status: 409 });
    }

    if (isPrismaRecordNotFoundError(error)) {
      logger.warn({
        context: "ProfileActions.updateProfile",
        error,
        message: "Profile update raced with another operation",
      });
      return ({ message: NO_PROFILE_MESSAGE, status: 404 });
    }

    logger.error({
      context: "ProfileActions.updateProfile",
      error,
      message: "Unexpected error updating Profile",
    });
    return ({ message: ERRORS.INTERNAL_SERVER_ERROR, status: 500 });
  }

}

// Private Objects -----------------------------------------------------------

const EMAIL_IN_USE_MESSAGE = "That email address is already in use";
const NO_PROFILE_MESSAGE = "No Profile found for the signed-in user";


