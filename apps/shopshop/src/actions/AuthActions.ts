"use server";

/**
 * Sign In/Sign Out/Sign Up processing actions, integrated with Better-Auth.
 */

// External Modules ----------------------------------------------------------

import { ActionResult } from "@repo/daisy-form/ActionResult";
import { dbShopShop, Profile } from "@repo/db-shopshop";
import { serverLogger as logger } from "@repo/shared-utils/ServerLogger";
import { headers as getHeaders } from "next/headers";

// Internal Modules ----------------------------------------------------------

import { auth, invalidateSessionProfileCacheByEmail } from "@/auth/auth-server";
import { SignInSchemaType } from "@/zod-schemas/SignInSchema";
import { SignUpSchemaType } from "@/zod-schemas/SignUpSchema";

// Public Objects ------------------------------------------------------------

export async function doSignInAction(formData: SignInSchemaType): Promise<ActionResult<Profile>> {

  logger.trace({
    context: "AuthActions.doSignInAction.input",
    formData: {
      ...formData,
      password: "*REDACTED*",
    }
  });

  try {
    // Invoke Better Auth directly in-process from the server action.
    await auth.api.signInEmail({
      body: {
        email: formData.email,
        password: formData.password,
      },
      headers: await getHeaders(),
    });

    // Look up corresponding Profile
    const profile = await getProfileByEmail(formData.email);

    if (!profile) {
      return {
        message: "Profile not found for this email address",
      };
    }

    const result: ActionResult<Profile> = {
      message: undefined,
      model: profile,
    };

    logger.trace({
      context: "AuthActions.doSignInAction.output",
      email: formData.email,
    });

    return result;

  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign in failed";
    logger.error({
      context: "AuthActions.doSignInAction.error",
      error,
    });
    return { message };
  }

}

export async function doSignOutAction(): Promise<ActionResult<Profile>> {

  logger.trace({
    context: "AuthActions.doSignOutAction.input",
  });

  try {
    await auth.api.signOut({
      headers: await getHeaders(),
    });

    logger.trace({
      context: "AuthActions.doSignOutAction.output",
    });

    return {
      message: undefined,
      model: undefined,
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign out failed";
    logger.error({
      context: "AuthActions.doSignOutAction.error",
      error,
    });
    return { message };
  }

}

export async function doSignUpAction(formData: SignUpSchemaType): Promise<ActionResult<Profile>> {

  logger.trace({
    context: "AuthActions.doSignUpAction.input",
    formData: {
      ...formData,
      confirmPassword: "*REDACTED*",
      password: "*REDACTED*",
    }
  });

  try {
    // Invoke Better Auth directly in-process from the server action.
    await auth.api.signUpEmail({
      body: {
        email: formData.email,
        password: formData.password,
        name: formData.name,
      },
      headers: await getHeaders(),
    });

    // Create corresponding Profile
    const profile = await upsertProfile(formData.email, formData.name);

    // Clear any stale/missing cache entry created before profile upsert.
    invalidateSessionProfileCacheByEmail(formData.email);

    if (!profile) {
      logger.error({
        context: "AuthActions.doSignUpAction.profile_error",
        email: formData.email,
        message: "Failed to create profile after successful sign up",
      });
      return {
        message: "Account created but profile setup failed. Please contact support.",
      };
    }

    const result: ActionResult<Profile> = {
      message: undefined,
      model: profile,
    };

    logger.trace({
      context: "AuthActions.doSignUpAction.output",
      email: formData.email,
    });

    return result;

  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign up failed";
    logger.error({
      context: "AuthActions.doSignUpAction.error",
      error,
    });
    return { message };
  }

}

// Private Objects -----------------------------------------------------------

/**
 * Look up Profile by email and return it, or null if not found.
 */
async function getProfileByEmail(email: string): Promise<Profile | null> {
  try {
    return await dbShopShop.profile.findUnique({
      where: { email },
    });
  } catch (error) {
    logger.error({
      context: "getProfileByEmail",
      error,
      email,
    });
    return null;
  }
}

/**
 * Create or update Profile for a user.
 */
async function upsertProfile(email: string, name: string): Promise<Profile | null> {
  try {
    return await dbShopShop.profile.upsert({
      where: { email },
      update: { name },
      create: { email, name },
    });
  } catch (error) {
    logger.error({
      context: "upsertProfile",
      error,
      email,
    });
    return null;
  }
}

