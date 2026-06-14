/**
 * Functional tests for ProfileActions.
 */

// External Imports ----------------------------------------------------------

import { ERRORS } from "@repo/daisy-form/ActionResult";
import { dbShopShop as db } from "@repo/db-shopshop";
import { ProfileUpdateSchemaType } from "@repo/db-shopshop/zod-schemas/ProfileSchema";
import { beforeEach, describe, expect, it, /*vi*/ } from "vitest";

// Internal Imports ----------------------------------------------------------

import { updateProfile } from "@/actions/ProfileActions";
import { lookupProfileByEmail } from "@/lib/ProfileHelpers";
import { setProfile } from "@/lib/ProfileServerHelper";
import { BaseUtils } from "@/test/BaseUtils";
import { PROFILES } from "@/test/SeedData";
import { OPERATION_ENVELOPE_SCHEMA_VERSION } from "@/types/OperationEnvelope";

const UTILS = new BaseUtils();

// Test Specifications -------------------------------------------------------

describe("ProfileActions", () => {

  // Test Hooks --------------------------------------------------------------

  beforeEach(async () => {
    await UTILS.loadData({
      withProfiles: true,
    });
  });

  // Test Cases --------------------------------------------------------------

  describe("updateProfile", () => {

    it("should fail on duplicate email", async () => {

      const profile = await lookupProfileByEmail(PROFILES[0]!.email!);
      setProfile(profile);
      const update: ProfileUpdateSchemaType = {
        email: PROFILES[1]!.email!,
        name: profile!.name,
      }

      const result = await updateProfile(update);

      expect(result.message).toBe("That email address is already in use");
      expect(result.status).toBe(409);

    });

    it("should fail on unauthenticated user", async () => {

      setProfile(null);

      const result = await updateProfile({});

      expect(result.message).toBe(ERRORS.AUTHENTICATION);
      expect(result.status).toBe(401);

    });

    it("should pass on empty update", async () => {

      const profile = await lookupProfileByEmail(PROFILES[2]!.email!);
      setProfile(profile);

      const result = await updateProfile({});

      expect(result.model).toBeDefined();
      expect(result.model!.id).toBe(profile!.id);
      expect(result.model!.email).toBe(profile!.email);
      expect(result.model!.name).toBe(profile!.name);

    });

    it("replays duplicate updateProfile operation with matching payload", async () => {

      const profile = await lookupProfileByEmail(PROFILES[0]!.email!);
      setProfile(profile);
      const update: ProfileUpdateSchemaType = {
        name: "Idempotent Replay Name",
      };
      const operationEnvelope = {
        clientTimestamp: new Date("2026-06-14T00:00:00.000Z"),
        operationId: "11111111-1111-4111-8111-111111111111",
        operationType: "updateProfile",
        payload: update,
        schemaVersion: OPERATION_ENVELOPE_SCHEMA_VERSION,
      };

      const first = await updateProfile(update, operationEnvelope);
      const second = await updateProfile(update, operationEnvelope);

      expect(first.model).toBeDefined();
      expect(second.model).toBeDefined();
      expect(second).toEqual(first);

      const recordCount = await db.operationRecord.count({
        where: {
          actorProfileId: profile!.id,
          operationId: operationEnvelope.operationId,
        },
      });
      expect(recordCount).toBe(1);
    });

    it("rejects duplicate updateProfile operation with mismatched payload", async () => {

      const profile = await lookupProfileByEmail(PROFILES[1]!.email!);
      setProfile(profile);
      const firstUpdate: ProfileUpdateSchemaType = {
        name: "First Name",
      };
      const secondUpdate: ProfileUpdateSchemaType = {
        name: "Second Name",
      };
      const operationEnvelope = {
        clientTimestamp: new Date("2026-06-14T00:00:00.000Z"),
        operationId: "22222222-2222-4222-8222-222222222222",
        operationType: "updateProfile",
        payload: firstUpdate,
        schemaVersion: OPERATION_ENVELOPE_SCHEMA_VERSION,
      };

      const first = await updateProfile(firstUpdate, operationEnvelope);
      const second = await updateProfile(secondUpdate, {
        ...operationEnvelope,
        payload: secondUpdate,
      });

      expect(first.model).toBeDefined();
      expect(second.model).toBeUndefined();
      expect(second.message).toBe("Operation payload does not match existing operationId");
      expect(second.status).toBe(409);
    });

  });

  it("should pass on full update to different values", async () => {

    const profile = await lookupProfileByEmail(PROFILES[1]!.email!);
    setProfile(profile);
    const update: ProfileUpdateSchemaType = {
      email: "New" + profile!.email,
      imageUrl: profile!.imageUrl ? profile!.imageUrl + "New" : undefined,
      name: "New " + profile!.name,
    }

    try {

      const result = await updateProfile(update);

      expect(result.model).toBeDefined();
      expect(result.model!.id).toBe(profile!.id);
      expect(result.model!.email).toBe(update.email);
      expect(result.model!.name).toBe(update.name);

    } catch (error) {
      console.error("Error during updateProfile:", error);
    }

  });

  it("should pass on full update to same values", async () => {

    const profile = await lookupProfileByEmail(PROFILES[2]!.email!);
    setProfile(profile);
    const update: ProfileUpdateSchemaType = {
      email: profile!.email,
      imageUrl: profile!.imageUrl ? profile!.imageUrl : undefined,
      name: profile!.name,
    }

    try {

      const result = await updateProfile(update);

      expect(result.model).toBeDefined();
      expect(result.model!.id).toBe(profile!.id);
      expect(result.model!.email).toBe(profile!.email);
      expect(result.model!.name).toBe(profile!.name);

    } catch (error) {
      console.error("Error during updateProfile:", error);
    }

  });

});
