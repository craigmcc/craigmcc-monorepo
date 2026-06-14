/**
 * Reusable idempotent operation wrapper for server-side write handlers.
 */

// External Imports ----------------------------------------------------------

import { type ActionResult, ERRORS } from "@repo/daisy-form/ActionResult";
import { createHash } from "node:crypto";

// Internal Imports ----------------------------------------------------------

import {
  completeOperationRecord,
  createOperationRecord,
  isUniqueConstraintError,
  lookupOperationRecord,
} from "@/lib/OperationRecordRepository";
import type { OperationType } from "@/types/OperationEnvelope";

// Public Objects ------------------------------------------------------------

export type ExecuteIdempotentOperationInput = {
  actorProfileId: string;
  operationId: string;
  operationType: OperationType;
  payload: unknown;
};

export async function executeIdempotentOperation<M>(
  input: ExecuteIdempotentOperationInput,
  handler: () => Promise<ActionResult<M>>,
): Promise<ActionResult<M>> {
  const payloadHash = hashPayload(input.payload);
  const existing = await lookupOperationRecord(input.actorProfileId, input.operationId);
  if (existing) {
    return replayOrReject<M>(existing.payloadHash, payloadHash, existing.responseBody);
  }

  const created = await tryCreatePendingRecord(input.actorProfileId, input.operationId, input.operationType, payloadHash);
  if (!created) {
    const raced = await lookupOperationRecord(input.actorProfileId, input.operationId);
    if (raced) {
      return replayOrReject<M>(raced.payloadHash, payloadHash, raced.responseBody);
    }

    return { message: ERRORS.INTERNAL_SERVER_ERROR, status: 500 };
  }

  try {
    const result = await handler();
    const snapshot = toReplaySnapshot(result);
    await completeOperationRecord({
      actorProfileId: input.actorProfileId,
      operationId: input.operationId,
      responseBody: snapshot,
      responseStatus: statusFromActionResult(snapshot),
      status: snapshot.status ? "REJECTED" : "COMPLETED",
    });
    return snapshot;
  } catch (error) {
    const fallback: ActionResult<M> = {
      message: ERRORS.INTERNAL_SERVER_ERROR,
      status: 500,
    };
    await completeOperationRecord({
      actorProfileId: input.actorProfileId,
      operationId: input.operationId,
      responseBody: fallback,
      responseStatus: 500,
      status: "REJECTED",
    });
    throw error;
  }
}

// Private Objects -----------------------------------------------------------

const PAYLOAD_MISMATCH_MESSAGE = "Operation payload does not match existing operationId";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entryValue]) => [key, canonicalize(entryValue)]);
  return Object.fromEntries(entries);
}

function hashPayload(payload: unknown): string {
  const canonical = canonicalize(payload);
  return createHash("sha256")
    .update(JSON.stringify(canonical))
    .digest("hex");
}

function replayOrReject<M>(storedPayloadHash: string, currentPayloadHash: string, responseBody: unknown): ActionResult<M> {
  if (storedPayloadHash !== currentPayloadHash) {
    return {
      message: PAYLOAD_MISMATCH_MESSAGE,
      status: 409,
    };
  }

  return responseBody as ActionResult<M>;
}

function statusFromActionResult(result: ActionResult<unknown>): number {
  if (result.status) {
    return result.status;
  }

  if (result.message) {
    return 400;
  }

  return 200;
}

function toReplaySnapshot<M>(result: ActionResult<M>): ActionResult<M> {
  return JSON.parse(JSON.stringify(result)) as ActionResult<M>;
}

async function tryCreatePendingRecord(
  actorProfileId: string,
  operationId: string,
  operationType: OperationType,
  payloadHash: string,
): Promise<boolean> {
  try {
    await createOperationRecord({
      actorProfileId,
      operationId,
      operationType,
      payloadHash,
    });
    return true;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return false;
    }

    throw error;
  }
}

