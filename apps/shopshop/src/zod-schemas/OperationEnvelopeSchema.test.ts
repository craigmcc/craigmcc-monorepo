/**
 * Tests for operation envelope schemas and helper utilities.
 */

// External Imports ----------------------------------------------------------

import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

// Internal Imports ----------------------------------------------------------

import {
  generateOperationId,
  isValidOperationType,
  parseOperationEnvelope,
  safeParseOperationEnvelope,
  tryParseOperationEnvelope,
} from "@/lib/OperationEnvelopeHelpers";
import { OPERATION_ENVELOPE_SCHEMA_VERSION } from "@/types/OperationEnvelope";
import { OperationEnvelopeSchema } from "@/zod-schemas/OperationEnvelopeSchema";

// Private Objects -----------------------------------------------------------

const VALID_ACTOR_PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const VALID_LIST_ID = "22222222-2222-4222-8222-222222222222";
const VALID_OPERATION_ID = "33333333-3333-4333-8333-333333333333";

function buildEnvelope(overrides: Record<string, unknown> = {}) {
  return {
    clientTimestamp: new Date("2026-06-09T00:00:00.000Z"),
    operationId: VALID_OPERATION_ID,
    operationType: "createList",
    payload: { name: "Groceries" },
    schemaVersion: OPERATION_ENVELOPE_SCHEMA_VERSION,
    ...overrides,
  };
}

// Public Objects ------------------------------------------------------------

describe("OperationEnvelopeSchema", () => {
  it("accepts a minimal valid envelope", () => {
    const result = OperationEnvelopeSchema.safeParse(buildEnvelope());

    expect(result.success).toBe(true);
  });

  it("accepts optional listId and actorProfileId", () => {
    const result = OperationEnvelopeSchema.safeParse(
      buildEnvelope({
        actorProfileId: VALID_ACTOR_PROFILE_ID,
        listId: VALID_LIST_ID,
      })
    );

    expect(result.success).toBe(true);
  });

  it("accepts clientTimestamp as an ISO string or Date", () => {
    const withDate = OperationEnvelopeSchema.safeParse(buildEnvelope());
    const withIsoString = OperationEnvelopeSchema.safeParse(
      buildEnvelope({ clientTimestamp: "2026-06-09T00:00:00.000Z" })
    );

    expect(withDate.success).toBe(true);
    expect(withIsoString.success).toBe(true);

    if (withIsoString.success) {
      expect(withIsoString.data.clientTimestamp).toBeInstanceOf(Date);
    }
  });

  it("rejects envelopes missing operationId", () => {
    const result = OperationEnvelopeSchema.safeParse(buildEnvelope({ operationId: undefined }));

    expect(result.success).toBe(false);
  });

  it("rejects envelopes when operationId is not a UUID", () => {
    const result = OperationEnvelopeSchema.safeParse(buildEnvelope({ operationId: "not-a-uuid" }));

    expect(result.success).toBe(false);
  });

  it("rejects envelopes missing operationType", () => {
    const result = OperationEnvelopeSchema.safeParse(buildEnvelope({ operationType: undefined }));

    expect(result.success).toBe(false);
  });

  it("rejects envelopes with unknown operationType", () => {
    const result = OperationEnvelopeSchema.safeParse(buildEnvelope({ operationType: "archiveList" }));

    expect(result.success).toBe(false);
  });

  it("rejects envelopes with an unsupported schemaVersion", () => {
    const result = OperationEnvelopeSchema.safeParse(buildEnvelope({ schemaVersion: 2 }));

    expect(result.success).toBe(false);
  });

  it("rejects envelopes when clientTimestamp is missing", () => {
    const result = OperationEnvelopeSchema.safeParse(buildEnvelope({ clientTimestamp: undefined }));

    expect(result.success).toBe(false);
  });

  it("rejects envelopes when clientTimestamp is not a valid date", () => {
    const result = OperationEnvelopeSchema.safeParse(buildEnvelope({ clientTimestamp: "bad-date" }));

    expect(result.success).toBe(false);
  });
});

describe("OperationEnvelopeHelpers", () => {
  it("generateOperationId produces a valid UUID", () => {
    const operationId = generateOperationId();

    expect(() => OperationEnvelopeSchema.shape.operationId.parse(operationId)).not.toThrow();
  });

  it("parseOperationEnvelope throws ZodError on invalid input", () => {
    const invalidEnvelope = buildEnvelope({ operationType: "not-supported" });

    expect(() => parseOperationEnvelope(invalidEnvelope)).toThrow(ZodError);
  });

  it("safeParseOperationEnvelope returns a full failure result on invalid input", () => {
    const result = safeParseOperationEnvelope(buildEnvelope({ operationType: "not-supported" }));

    expect(result.success).toBe(false);
  });

  it("tryParseOperationEnvelope returns null on invalid input", () => {
    const result = tryParseOperationEnvelope(buildEnvelope({ operationType: "not-supported" }));

    expect(result).toBeNull();
  });

  it("isValidOperationType returns true for known values and false for unknown values", () => {
    expect(isValidOperationType("createList")).toBe(true);
    expect(isValidOperationType("nope")).toBe(false);
  });
});

