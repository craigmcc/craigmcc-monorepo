/**
 * Zod schema for SignInForm.
 */

// External Modules ----------------------------------------------------------

import * as z from "zod";

// Internal Modules ----------------------------------------------------------

// Public Objects ------------------------------------------------------------

export const SignInSchema = z.object({
  email: z.email().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export type SignInSchemaType = z.infer<typeof SignInSchema>;
