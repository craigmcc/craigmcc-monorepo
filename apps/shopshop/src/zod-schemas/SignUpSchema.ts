/**
 * Zod schema for SignUpForm.
 */

// External Modules ----------------------------------------------------------

import * as z from "zod";

// Public Objects ------------------------------------------------------------

export const SignUpSchema = z.object({
  confirmPassword: z.string().min(1, "Confirm Password is required"),
  email: z.email().min(1, "Email is required"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(1, "Password is required"),
})
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpSchemaType = z.infer<typeof SignUpSchema>;
