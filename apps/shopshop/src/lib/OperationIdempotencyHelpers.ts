/**
 * Shared helpers for idempotent operation envelope handling.
 */

// External Imports ----------------------------------------------------------

// Internal Imports ----------------------------------------------------------

import { safeParseOperationEnvelope } from "@/lib/OperationEnvelopeHelpers";
import type { OperationType } from "@/types/OperationEnvelope";

// Public Objects ------------------------------------------------------------

/**
 * Return the operationId when a valid envelope with the expected operationType is provided.
 */
export function extractOperationId(
  operationEnvelope: unknown,
  operationType: OperationType,
): string | null {
  if (!operationEnvelope) {
    return null;
  }

  const result = safeParseOperationEnvelope(operationEnvelope);
  if (!result.success) {
    return null;
  }

  if (result.data.operationType !== operationType) {
    return null;
  }

  return result.data.operationId;
}


