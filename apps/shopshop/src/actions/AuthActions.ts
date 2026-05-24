"use server";

/**
 * Sign In/Sign Out/Sign Up processing actions, integrated with Better-Auth.
 */

// External Modules ----------------------------------------------------------

import { ActionResult } from "@repo/daisy-form/ActionResult";
import { Profile } from "@repo/db-shopshop/client";
import { serverLogger as logger } from "@repo/shared-utils/ServerLogger";

// Internal Modules ----------------------------------------------------------

//import { auth } from "@/auth/auth-server";
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

  // TODO: Perform authentication via better-auth.
  // TODO: If authentication fails, return an ActionResult with an error message.

  // TODO: Look up the Profile for this email, inserting if necessary (which iss an error because Profile and User are out of sync)

  // TODO: Enhance the completed session by including the Profile

  // TODO: Return the completed result

  const result: ActionResult<Profile> = {
    message: undefined,
//    model: profile,
  }
  logger.trace({
    context: "AuthActions.doSignInAction.output",
    result,
  });
  return result;

}

export async function doSignOutAction(): Promise<ActionResult<Profile>> {

  logger.trace({
    context: "AuthActions.doSignOutAction.input",
  });

  // TODO: Perform the better-auth sign out action

  // Report the resulting success
  return {
    message: undefined,
    model: undefined, // TODO: Profile that was signed out???
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

  // TODO: Complete sign up via better-auth (return ActionResult with error on fail)

  // TODO: Create and save a corresponding Profile (upsert if needed with logged error)

  // TODO: Enhance the completed session by including the Profile

  // TODO: Return the completed result

  const result: ActionResult<Profile> = {
    message: undefined,
//    model: profile,
  }
  logger.trace({
    context: "AuthActions.doSignUpAction.output",
    result,
  });
  return result;

}
