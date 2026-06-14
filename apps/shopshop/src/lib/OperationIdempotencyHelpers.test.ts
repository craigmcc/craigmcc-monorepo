/**
 * Tests for idempotent operation envelope helpers.
 */

// External Imports ----------------------------------------------------------

import { describe, expect, it } from "vitest";

// Internal Imports ----------------------------------------------------------

import { extractOperationId } from "@/lib/OperationIdempotencyHelpers";
import { OPERATION_ENVELOPE_SCHEMA_VERSION } from "@/types/OperationEnvelope";

// Test Specifications -------------------------------------------------------

describe("OperationIdempotencyHelpers", () => {

  describe("extractOperationId", () => {

    it("returns operationId for matching operation type", () => {
      const operationId = extractOperationId({
        clientTimestamp: new Date("2026-06-14T00:00:00.000Z"),
        operationId: "11111111-1111-4111-8111-111111111111",
        operationType: "updateProfile",
        payload: {
          name: "Updated",
        },
        schemaVersion: OPERATION_ENVELOPE_SCHEMA_VERSION,
      }, "updateProfile");

      expect(operationId).toBe("11111111-1111-4111-8111-111111111111");
    });

    it("returns null for mismatched operation type", () => {
      const operationId = extractOperationId({
        clientTimestamp: new Date("2026-06-14T00:00:00.000Z"),
        operationId: "22222222-2222-4222-8222-222222222222",
        operationType: "createList",
        payload: {
          name: "List",
        },
        schemaVersion: OPERATION_ENVELOPE_SCHEMA_VERSION,
      }, "updateProfile");

      expect(operationId).toBeNull();
    });

  });

});

