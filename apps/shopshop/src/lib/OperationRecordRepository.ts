/**
 * Repository functions for recording operations performed by users, for later
 * retrieval and display in the UI.  These are NOT server actions, but are
 * called by server actions to record the operations performed by those actions.
 * They are also called by client components to retrieve the recorded
 * operations for display in the UI.
 */

// External Imports ----------------------------------------------------------

import { dbShopShop as db } from "@repo/db-shopshop";
import type { OperationRecord } from "@repo/db-shopshop/types";

// Internal Imports ----------------------------------------------------------

import { extractPrismaUniqueConstraintTargets } from "@/lib/PrismaErrorHelpers";

// Public Objects ------------------------------------------------------------

/**
 * Properties required to create an operation record.
 */
export type OperationRecordCreateInput = {
  actorProfileId: string;
  operationId: string;
  operationType: string;
  payloadHash: string;
};

/**
 * Mark the specified operation record as completed or rejected.
 *
 * @param input
 */
export async function completeOperationRecord(input: {
  actorProfileId: string;
  operationId: string;
  responseBody: unknown;
  responseStatus: number;
  status: "COMPLETED" | "REJECTED";
  conflictCode?: string;
}): Promise<OperationRecord> {
  return db.operationRecord.update({
    where: {
      actorProfileId_operationId: {
        actorProfileId: input.actorProfileId,
        operationId: input.operationId,
      },
    },
    data: {
      completedAt: new Date(),
      conflictCode: input.conflictCode ?? null,
      responseBody: toOperationRecordResponseBody(input.responseBody),
      responseStatus: input.responseStatus,
      status: input.status,
    },
  });
}

/**
 * Create a new operation record.  TODO: duplicate key handled by caller logic
 * @param input
 */
export async function createOperationRecord(input: OperationRecordCreateInput): Promise<OperationRecord> {
  return db.operationRecord.create({
    data: {
      actorProfileId: input.actorProfileId,
      operationId: input.operationId,
      operationType: input.operationType,
      payloadHash: input.payloadHash,
    },
  });
}

/**
 * Detect Prisma unique violation (P2002) for (actorProfileId, operationId).
 *
 * @param error
 */
export function isUniqueConstraintError(error: unknown): boolean {
  const targets = extractPrismaUniqueConstraintTargets(error);
  if (targets.length === 0) {
    return false;
  }

  return hasUniqueTargetSet(targets, OPERATION_RECORD_UNIQUE_COLUMNS) ||
    hasUniqueTargetSet(targets, OPERATION_RECORD_UNIQUE_FIELDS);
}

/**
 * Look up and return an operation record matching the specified values,
 * or return null if there is no such operation record.
 *
 * @param actorProfileId
 * @param operationId
 */
export async function lookupOperationRecord(actorProfileId: string, operationId: string): Promise<OperationRecord | null> {
  return db.operationRecord.findUnique({
    where: {
      actorProfileId_operationId: {
        actorProfileId,
        operationId,
      },
    },
  });
}

// Private Objects -----------------------------------------------------------

const OPERATION_RECORD_UNIQUE_COLUMNS = ["actor_profile_id", "operation_id"] as const;
const OPERATION_RECORD_UNIQUE_FIELDS = ["actorProfileId", "operationId"] as const;

type OperationRecordUpdateData = Parameters<typeof db.operationRecord.update>[0]["data"];
type OperationRecordResponseBody = OperationRecordUpdateData["responseBody"];

function hasUniqueTargetSet(targets: string[], uniqueFields: readonly string[]): boolean {
  return uniqueFields.every((field) => targets.includes(field));
}

function toOperationRecordResponseBody(responseBody: unknown): OperationRecordResponseBody {
  return responseBody as OperationRecordResponseBody;
}

