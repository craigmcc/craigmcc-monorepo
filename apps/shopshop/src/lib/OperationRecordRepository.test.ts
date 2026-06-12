/**
 * Integration tests for operation record repository behavior.
 */

// External Imports ----------------------------------------------------------

import { dbShopShop as db } from "@repo/db-shopshop";
import { beforeEach, describe, expect, it } from "vitest";

// Internal Imports ----------------------------------------------------------

import {
  completeOperationRecord,
  createOperationRecord,
  isUniqueConstraintError,
  lookupOperationRecord,
} from "@/lib/OperationRecordRepository";
import { BaseUtils } from "@/test/BaseUtils";

// Test Specifications -------------------------------------------------------

const CONFLICT_CODE = "PAYLOAD_HASH_MISMATCH";
const OPERATION_ID = "operation-001";
const OPERATION_TYPE = "LIST_CREATE";
const PAYLOAD_HASH_A = "hash-a";
const PAYLOAD_HASH_B = "hash-b";
const RESPONSE_BODY = {
  model: {
    id: "list-123",
  },
  message: "Created",
};
const RESPONSE_STATUS = 201;
const UTILS = new BaseUtils();

describe("OperationRecordRepository", () => {
  let actorProfileId = "";

  beforeEach(async () => {
    const { profiles } = await UTILS.loadData({
      withProfiles: true,
    });

    actorProfileId = profiles[0]!.id;
  });

  describe("record creation", () => {

    it("creates a first-seen operation record with PENDING status", async () => {
      const created = await createOperationRecord({
        actorProfileId,
        operationId: OPERATION_ID,
        operationType: OPERATION_TYPE,
        payloadHash: PAYLOAD_HASH_A,
      });

      expect(created.actorProfileId).toBe(actorProfileId);
      expect(created.operationId).toBe(OPERATION_ID);
      expect(created.operationType).toBe(OPERATION_TYPE);
      expect(created.payloadHash).toBe(PAYLOAD_HASH_A);
      expect(created.status).toBe("PENDING");
      expect(created.completedAt).toBeNull();
    });

  });

  describe("lookup behavior", () => {

    it("returns null when no operation record exists", async () => {
      const found = await lookupOperationRecord(actorProfileId, OPERATION_ID);

      expect(found).toBeNull();
    });

    it("returns the operation record after create", async () => {
      await createOperationRecord({
        actorProfileId,
        operationId: OPERATION_ID,
        operationType: OPERATION_TYPE,
        payloadHash: PAYLOAD_HASH_A,
      });

      const found = await lookupOperationRecord(actorProfileId, OPERATION_ID);

      expect(found).not.toBeNull();
      expect(found!.actorProfileId).toBe(actorProfileId);
      expect(found!.operationId).toBe(OPERATION_ID);
      expect(found!.operationType).toBe(OPERATION_TYPE);
      expect(found!.payloadHash).toBe(PAYLOAD_HASH_A);
    });

  });

  describe("duplicate key behavior", () => {

    it("fails duplicate create with unique constraint and helper detects it", async () => {
      await createOperationRecord({
        actorProfileId,
        operationId: OPERATION_ID,
        operationType: OPERATION_TYPE,
        payloadHash: PAYLOAD_HASH_A,
      });

      let duplicateError: unknown = null;
      try {
        await createOperationRecord({
          actorProfileId,
          operationId: OPERATION_ID,
          operationType: OPERATION_TYPE,
          payloadHash: PAYLOAD_HASH_A,
        });
      } catch (error) {
        duplicateError = error;
      }

      expect(duplicateError).not.toBeNull();
      expect(isUniqueConstraintError(duplicateError)).toBe(true);
    });

  });

  describe("completion behavior", () => {

    it("stores response snapshot and transitions to terminal status", async () => {
      await createOperationRecord({
        actorProfileId,
        operationId: OPERATION_ID,
        operationType: OPERATION_TYPE,
        payloadHash: PAYLOAD_HASH_A,
      });

      const completed = await completeOperationRecord({
        actorProfileId,
        operationId: OPERATION_ID,
        responseBody: RESPONSE_BODY,
        responseStatus: RESPONSE_STATUS,
        status: "COMPLETED",
      });

      expect(completed.status).toBe("COMPLETED");
      expect(completed.responseStatus).toBe(RESPONSE_STATUS);
      expect(completed.responseBody).toEqual(RESPONSE_BODY);
      expect(completed.completedAt).toBeInstanceOf(Date);
      expect(completed.conflictCode).toBeNull();
    });

    it("stores conflictCode when completing with REJECTED status", async () => {
      await createOperationRecord({
        actorProfileId,
        operationId: OPERATION_ID,
        operationType: OPERATION_TYPE,
        payloadHash: PAYLOAD_HASH_A,
      });

      const completed = await completeOperationRecord({
        actorProfileId,
        conflictCode: CONFLICT_CODE,
        operationId: OPERATION_ID,
        responseBody: {
          message: "Rejected",
        },
        responseStatus: 409,
        status: "REJECTED",
      });

      expect(completed.status).toBe("REJECTED");
      expect(completed.conflictCode).toBe(CONFLICT_CODE);
      expect(completed.completedAt).toBeInstanceOf(Date);
    });

  });

  describe("payload mismatch preparation", () => {

    it("detects same key with different payload hash via lookup assertion", async () => {
      await createOperationRecord({
        actorProfileId,
        operationId: OPERATION_ID,
        operationType: OPERATION_TYPE,
        payloadHash: PAYLOAD_HASH_A,
      });

      const existing = await lookupOperationRecord(actorProfileId, OPERATION_ID);

      expect(existing).not.toBeNull();
      expect(existing!.payloadHash).toBe(PAYLOAD_HASH_A);
      expect(existing!.payloadHash).not.toBe(PAYLOAD_HASH_B);

      const operationCount = await db.operationRecord.count({
        where: {
          actorProfileId,
          operationId: OPERATION_ID,
        },
      });
      expect(operationCount).toBe(1);
    });

  });

});

