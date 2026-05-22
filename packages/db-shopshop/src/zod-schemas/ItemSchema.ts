/**
 * Zod schemas for Item models.
 */

// External Modules ----------------------------------------------------------

import * as z from "zod";

// Public Objects ------------------------------------------------------------

export const ItemCreateSchema = z.object({
  categoryId: z.uuid(),
  checked: z.boolean().optional(),
  listId: z.uuid(),
  name: z.string().min(1, "Name is required"),
  notes: z.string().optional(),
  quantity: z.number().optional(),
  selected: z.boolean().optional(),
});

export type ItemCreateSchemaType = z.infer<typeof ItemCreateSchema>;

export const ItemUpdateSchema = ItemCreateSchema
  .partial()
  .omit({ categoryId: true, listId: true });

export type ItemUpdateSchemaType = z.infer<typeof ItemUpdateSchema>;
