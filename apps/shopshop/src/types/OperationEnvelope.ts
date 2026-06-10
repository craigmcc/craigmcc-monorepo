/**
 * Types for managing operation transactions.
 */

// Public Objects ------------------------------------------------------------

/**
 * Enumeration of individual operations that can be performed and synchronized
 * in this application.  This list will grow as new operations are added.
 */
export type OperationType =
  | "createCategory"
  | "createItem"
  | "createList"
  | "deleteCategory"
  | "deleteItem"
  | "deleteList"
  | "updateCategory"
  | "updateItem"
  | "updateList"
  | "updateProfile";

/**
 * The envelope for an operation transaction, which includes metadata about
 * the operation.
 */
export type OperationEnvelope<T = unknown> = {
  // Profile ID of the actor (resolved server-side when possible).
  actorProfileId?: string;
  // Timestamp of the client initiating this operation.
  clientTimestamp: Date;
  // List ID of the affected List (null for Profile-scoped operations)
  listId?: string;
  // Unique identifier for this operation, used for idempotency
  // and synchronization.
  operationId: string; // UUID, idempotency key
  // Type of operation represented by this transaction.
  operationType: OperationType;
  // Data payload for this transaction (generic based on operationType).
  payload: T;
  // Schema version for this transaction (allowing for future expansion).
  schemaVersion: number;
};

/**
 * Version constant for parsers and migrations.
 */
export const OPERATION_ENVELOPE_SCHEMA_VERSION = 1;
