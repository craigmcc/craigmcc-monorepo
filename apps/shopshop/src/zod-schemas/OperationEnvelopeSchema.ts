/**
 * Zod schemas for operation transactions.
 */

// External Imports ----------------------------------------------------------

import type { CategoryCreateSchemaType, CategoryUpdateSchemaType } from "@repo/db-shopshop/zod-schemas/CategorySchema";
import type { ItemCreateSchemaType, ItemUpdateSchemaType } from "@repo/db-shopshop/zod-schemas/ItemSchema";
import type { ListCreateSchemaType, ListUpdateSchemaType } from "@repo/db-shopshop/zod-schemas/ListSchema";
import type { ProfileUpdateSchemaType } from "@repo/db-shopshop/zod-schemas/ProfileSchema";

import { z } from "zod";

// Internal Imports ----------------------------------------------------------

import { OPERATION_ENVELOPE_SCHEMA_VERSION } from "@/types/OperationEnvelope";

// Public Objects ------------------------------------------------------------

/**
 * Enumeration of valid operation types.  Must match the values in
 * the `OperationType` type.
 */
export const OperationTypeSchema = z.enum([
  "createCategory",
  "createItem",
  "createList",
  "deleteCategory",
  "deleteItem",
  "deleteList",
  "updateCategory",
  "updateItem",
  "updateList",
  "updateProfile",
]);

/**
 * Envelope schema for an operation transaction, including metadata and a generic
 * payload.  Must correspond to the `OperationEnvelope` type.
 */
export const OperationEnvelopeSchema = z.object({
  actorProfileId: z.string().uuid().optional(),
  clientTimestamp: z.coerce.date(),
  listId: z.string().uuid().optional(),
  operationId: z.string().uuid(),
  operationType: OperationTypeSchema,
  // Payload validation is delegated to per-operation-type schemas.
  payload: z.unknown(),
  schemaVersion: z.literal(OPERATION_ENVELOPE_SCHEMA_VERSION),
});

export type OperationEnvelopeSchemaType = z.infer<typeof OperationEnvelopeSchema>;

/**
 * Helper to map operationType to its payload schema.  This is used for
 * validating the payload based on the operationType.  Must include schemas
 * for all supported operation types.
  */
export type OperationPayloadMap = {
  createCategory: CategoryCreateSchemaType;
  createItem: ItemCreateSchemaType;
  createList: ListCreateSchemaType;
  deleteCategory: { categoryId: string };
  deleteItem: { itemId: string };
  deleteList: { listId: string };
  updateCategory: CategoryUpdateSchemaType
  updateItem: ItemUpdateSchemaType;
  updateList: ListUpdateSchemaType;
  updateProfile: ProfileUpdateSchemaType;
};
