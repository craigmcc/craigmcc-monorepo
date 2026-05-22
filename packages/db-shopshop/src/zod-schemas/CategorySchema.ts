/**
 * Zod schemas for Category models.
 */

// External Modules ----------------------------------------------------------

import * as z from "zod";

// Public Objects ------------------------------------------------------------

export const CategoryCreateSchema = z.object({
  listId: z.uuid(),
  name: z.string().min(1, "Name is required"),
});

export type CategoryCreateSchemaType = z.infer<typeof CategoryCreateSchema>;

export const CategoryUpdateSchema = CategoryCreateSchema
  .partial()
  .omit({ listId: true });

export type CategoryUpdateSchemaType = z.infer<typeof CategoryUpdateSchema>;
