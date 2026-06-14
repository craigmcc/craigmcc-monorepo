/**
 * Integration tests for idempotent operation execution wrapper behavior.
 */

// External Imports ----------------------------------------------------------

import type { ActionResult } from "@repo/daisy-form/ActionResult";
import { beforeEach, describe, expect, it } from "vitest";

// Internal Imports ----------------------------------------------------------

import { executeIdempotentOperation } from "@/lib/ExecuteIdempotentOperation";
import { lookupOperationRecord } from "@/lib/OperationRecordRepository";
import { BaseUtils } from "@/test/BaseUtils";

// Test Specifications -------------------------------------------------------

const UTILS = new BaseUtils();

describe("ExecuteIdempotentOperation", () => {
  let actorProfileId = "";

  beforeEach(async () => {
    const { profiles } = await UTILS.loadData({
      withProfiles: true,
    });
    actorProfileId = profiles[0]!.id;
  });

  it("executes first-seen operation and stores COMPLETED snapshot", async () => {
    let executions = 0;

    const result = await executeIdempotentOperation({
      actorProfileId,
      operationId: "33333333-3333-4333-8333-333333333333",
      operationType: "updateProfile",
      payload: {
        name: "First",
      },
    }, async (): Promise<ActionResult<{ name: string }>> => {
      executions += 1;
      return {
        model: {
          name: "First",
        },
      };
    });

    const record = await lookupOperationRecord(actorProfileId, "33333333-3333-4333-8333-333333333333");

    expect(executions).toBe(1);
    expect(result.model).toEqual({ name: "First" });
    expect(record).not.toBeNull();
    expect(record!.status).toBe("COMPLETED");
    expect(record!.responseBody).toEqual(result);
  });

  it("replays stored response for duplicate operation with same payload", async () => {
    let executions = 0;

    const first = await executeIdempotentOperation({
      actorProfileId,
      operationId: "44444444-4444-4444-8444-444444444444",
      operationType: "updateProfile",
      payload: {
        name: "Replay",
      },
    }, async (): Promise<ActionResult<{ name: string }>> => {
      executions += 1;
      return {
        model: {
          name: "Replay",
        },
      };
    });

    const second = await executeIdempotentOperation({
      actorProfileId,
      operationId: "44444444-4444-4444-8444-444444444444",
      operationType: "updateProfile",
      payload: {
        name: "Replay",
      },
    }, async (): Promise<ActionResult<{ name: string }>> => {
      executions += 1;
      return {
        model: {
          name: "Should Not Run",
        },
      };
    });

    expect(executions).toBe(1);
    expect(second).toEqual(first);
  });

  it("rejects duplicate operationId when payload hash differs", async () => {
    await executeIdempotentOperation({
      actorProfileId,
      operationId: "55555555-5555-4555-8555-555555555555",
      operationType: "updateProfile",
      payload: {
        name: "Original",
      },
    }, async (): Promise<ActionResult<{ name: string }>> => {
      return {
        model: {
          name: "Original",
        },
      };
    });

    const conflict = await executeIdempotentOperation({
      actorProfileId,
      operationId: "55555555-5555-4555-8555-555555555555",
      operationType: "updateProfile",
      payload: {
        name: "Changed",
      },
    }, async (): Promise<ActionResult<{ name: string }>> => {
      return {
        model: {
          name: "Should Not Run",
        },
      };
    });

    expect(conflict.model).toBeUndefined();
    expect(conflict.message).toBe("Operation payload does not match existing operationId");
    expect(conflict.status).toBe(409);
  });
});

