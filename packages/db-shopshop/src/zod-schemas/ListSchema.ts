/**
 * Zod schemas for List models.
 */

// External Modules ----------------------------------------------------------

import * as z from "zod";

// Public Objects ------------------------------------------------------------

export const ListCreateSchema = z.object({
  imageUrl: z.url("Invalid image URL").optional(),
  name: z.string().min(1, "Name is required"),
  private: z.boolean().default(false).optional(),
});

export type ListCreateSchemaType = z.infer<typeof ListCreateSchema>;

export const ListUpdateSchema = ListCreateSchema.partial();

export type ListUpdateSchemaType = z.infer<typeof ListUpdateSchema>;
