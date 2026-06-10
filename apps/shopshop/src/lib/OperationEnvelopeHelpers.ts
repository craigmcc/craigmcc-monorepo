/**
 * Helper utilities for managing operation transactions.
 */

// External Imports ----------------------------------------------------------

// Internal Imports ----------------------------------------------------------

import type { OperationEnvelope } from "@/types/OperationEnvelope";
import { OperationEnvelopeSchema, OperationTypeSchema } from "@/zod-schemas/OperationEnvelopeSchema";

// Public Objects ------------------------------------------------------------

/**
 * Generate a new operationId (UUID).
 */
export function generateOperationId(): string {
  return crypto.randomUUID();
}

/**
 * Check if a given operationType is valid.
 */
export function isValidOperationType(operationType: string): boolean {
  return OperationTypeSchema.safeParse(operationType).success;
}

/**
 * Parse and validate an operation envelope.
 * @throws ZodError if validation fails
 */
export function parseOperationEnvelope(data: unknown): OperationEnvelope {
  return OperationEnvelopeSchema.parse(data);
}

/**
 * Safely parse and return the data, and return the full safeParse result.
 */
export function safeParseOperationEnvelope(data: unknown):
  ReturnType<typeof OperationEnvelopeSchema.safeParse>
{
  return OperationEnvelopeSchema.safeParse(data);
}

/**
 * Safely parse and return the data, or return null if validation fails.
 * Any logging of such a failure is up to the caller.
 */
export function tryParseOperationEnvelope(data: unknown): OperationEnvelope | null {
  const result = safeParseOperationEnvelope(data);
  return result.success ? result.data : null;
}
