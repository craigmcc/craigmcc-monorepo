/**
 * Zod schemas for Profile models.
 */

// External Modules ----------------------------------------------------------

import * as z from "zod";

// Public Objects ------------------------------------------------------------

export const ProfileCreateSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  imageUrl: z.url({ message: "Invalid image URL" }).optional(),
  name: z.string().min(1, { message: "Name is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export type ProfileCreateSchemaType = z.infer<typeof ProfileCreateSchema>;

export const ProfileUpdateSchema = ProfileCreateSchema.partial();

export type ProfileUpdateSchemaType = z.infer<typeof ProfileUpdateSchema>;
