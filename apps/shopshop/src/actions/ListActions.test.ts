/**
 * Functional tests for ListActions.
 */

// External Imports ----------------------------------------------------------

import { ERRORS } from "@repo/daisy-form/ActionResult";
import { dbShopShop as db } from "@repo/db-shopshop";
import { MemberRole } from "@repo/db-shopshop/enums";
import {
  ListCreateSchemaType,
  ListUpdateSchemaType,
} from "@repo/db-shopshop/zod-schemas/ListSchema";
import { beforeEach, describe, expect, it } from "vitest";

// Internal Imports ----------------------------------------------------------

import { createList, deleteList, updateList } from "@/actions/ListActions";
import { lookupCategoryByName } from "@/lib/CategoryHelpers";
import { InitialListData } from "@/lib/InitialListData";
import { lookupListByRole } from "@/lib/ListHelpers";
import { lookupProfileByEmail } from "@/lib/ProfileHelpers";
import { setProfile } from "@/lib/ProfileServerHelper";
import { BaseUtils } from "@/test/BaseUtils";
import { PROFILES } from "@/test/SeedData";
import { OPERATION_ENVELOPE_SCHEMA_VERSION } from "@/types/OperationEnvelope";

const NOT_AUTHORIZED_MESSAGE = "This Profile is not authorized to perform this action";
const UTILS = new BaseUtils();

// Test Specifications -------------------------------------------------------

describe("ListActions", () => {

  // Test Hooks --------------------------------------------------------------

  beforeEach(async () => {
    setProfile(null);
    await UTILS.loadData({
      withLists: true,
      withMembers: true,
      withProfiles: true,
    });
  });

  // Test Cases --------------------------------------------------------------

  describe("createList", () => {

    it("should fail on unauthenticated user", async () => {

      const data: ListCreateSchemaType = {
        name: "Weekend Run",
      };

      const result = await createList(data);

      expect(result.message).toBe(ERRORS.AUTHENTICATION);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(401);

    });

    it("should fail on invalid list data", async () => {

      const profile = await lookupProfileByEmail(PROFILES[0]!.email!);
      setProfile(profile);
      const data: ListCreateSchemaType = {
        name: "",
      };

      const result = await createList(data);

      expect(result.message).toBe(ERRORS.DATA_VALIDATION);
      expect(result.fieldErrors).toBeDefined();
      expect(result.status).toBe(400);

    });

    it("should create a list and an ADMIN member for the creator", async () => {

      const profile = await lookupProfileByEmail(PROFILES[0]!.email!);
      setProfile(profile);
      const data: ListCreateSchemaType = {
        imageUrl: "https://example.com/list.png",
        name: "Weekend Run",
        private: true,
      };

      const result = await createList(data);

      expect(result.model).toBeDefined();
      expect(result.model!.name).toBe(data.name);
      expect(result.model!.imageUrl).toBe(data.imageUrl);
      expect(result.model!.private).toBe(data.private);

      const createdMember = await db.member.findFirst({
        where: {
          listId: result.model!.id,
          profileId: profile!.id,
        },
      });
      expect(createdMember).toBeDefined();
      expect(createdMember!.role).toBe(MemberRole.ADMIN);

      const createdCategory = await lookupCategoryByName(result.model!, InitialListData[0]![0]!);
      expect(createdCategory).not.toBeNull();

      const createdItemCount = await db.item.count({
        where: {
          listId: result.model!.id,
        },
      });
      expect(createdItemCount).toBeGreaterThan(0);

    });

    it("replays duplicate createList with same payload and no extra side effects", async () => {

      const profile = await lookupProfileByEmail(PROFILES[0]!.email!);
      setProfile(profile);
      const data: ListCreateSchemaType = {
        name: "Idempotent Create List",
      };
      const operationEnvelope = makeEnvelope("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "createList", data);
      const listCountBefore = await db.list.count();

      const first = await createList(data, operationEnvelope);
      const second = await createList(data, operationEnvelope);

      const listCountAfter = await db.list.count();
      expect(first.model).toBeDefined();
      expect(second).toEqual(first);
      expect(listCountAfter).toBe(listCountBefore + 1);

      const operationCount = await db.operationRecord.count({
        where: {
          actorProfileId: profile!.id,
          operationId: operationEnvelope.operationId,
        },
      });
      expect(operationCount).toBe(1);
    });

    it("rejects duplicate createList with mismatched payload", async () => {

      const profile = await lookupProfileByEmail(PROFILES[0]!.email!);
      setProfile(profile);
      const firstData: ListCreateSchemaType = {
        name: "First Create Payload",
      };
      const secondData: ListCreateSchemaType = {
        name: "Second Create Payload",
      };
      const operationEnvelope = makeEnvelope("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "createList", firstData);

      await createList(firstData, operationEnvelope);
      const conflict = await createList(secondData, {
        ...operationEnvelope,
        payload: secondData,
      });

      expect(conflict.model).toBeUndefined();
      expect(conflict.message).toBe("Operation payload does not match existing operationId");
      expect(conflict.status).toBe(409);
    });

  });

  describe("updateList", () => {

    it("should fail on invalid list ID", async () => {

      const result = await updateList("not-a-uuid", {});

      expect(result.message).toBe(ERRORS.ID_VALIDATION);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(400);

    });

    it("should fail on unauthenticated user", async () => {

      const adminProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const list = await lookupListByRole(adminProfile!, MemberRole.ADMIN);

      const result = await updateList(list!.id, {
        name: "Renamed",
      });

      expect(result.message).toBe(ERRORS.AUTHENTICATION);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(401);

    });

    it("should fail on unauthorized user", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestList = await lookupListByRole(guestProfile!, MemberRole.GUEST);
      setProfile(guestProfile);

      const result = await updateList(guestList!.id, {
        name: "Not Allowed",
      });

      expect(result.message).toBe(NOT_AUTHORIZED_MESSAGE);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(403);

    });

    it("should fail on invalid update data", async () => {

      const adminProfile = await lookupProfileByEmail(PROFILES[1]!.email!);
      const list = await lookupListByRole(adminProfile!, MemberRole.ADMIN);
      setProfile(adminProfile);
      const data: ListUpdateSchemaType = {
        name: "",
      };

      const result = await updateList(list!.id, data);

      expect(result.message).toBe(ERRORS.DATA_VALIDATION);
      expect(result.fieldErrors).toBeDefined();
      expect(result.status).toBe(400);

    });

    it("should update a list for an ADMIN member", async () => {

      const adminProfile = await lookupProfileByEmail(PROFILES[1]!.email!);
      const list = await lookupListByRole(adminProfile!, MemberRole.ADMIN);
      setProfile(adminProfile);
      const data: ListUpdateSchemaType = {
        imageUrl: "https://example.com/new-list.png",
        name: "Updated Name",
        private: true,
      };

      const result = await updateList(list!.id, data);

      expect(result.model).toBeDefined();
      expect(result.model!.id).toBe(list!.id);
      expect(result.model!.imageUrl).toBe(data.imageUrl);
      expect(result.model!.name).toBe(data.name);
      expect(result.model!.private).toBe(data.private);

    });

    it("replays duplicate updateList with same payload", async () => {

      const adminProfile = await lookupProfileByEmail(PROFILES[1]!.email!);
      const list = await lookupListByRole(adminProfile!, MemberRole.ADMIN);
      setProfile(adminProfile);
      const data: ListUpdateSchemaType = {
        name: "Replay Update Name",
      };
      const operationEnvelope = makeEnvelope("cccccccc-cccc-4ccc-8ccc-cccccccccccc", "updateList", data);

      const first = await updateList(list!.id, data, operationEnvelope);
      const second = await updateList(list!.id, data, operationEnvelope);

      expect(first.model).toBeDefined();
      expect(second).toEqual(first);
    });

    it("rejects duplicate updateList with mismatched payload", async () => {

      const adminProfile = await lookupProfileByEmail(PROFILES[1]!.email!);
      const list = await lookupListByRole(adminProfile!, MemberRole.ADMIN);
      setProfile(adminProfile);
      const firstData: ListUpdateSchemaType = {
        name: "First Update Name",
      };
      const secondData: ListUpdateSchemaType = {
        name: "Second Update Name",
      };
      const operationEnvelope = makeEnvelope("dddddddd-dddd-4ddd-8ddd-dddddddddddd", "updateList", firstData);

      await updateList(list!.id, firstData, operationEnvelope);
      const conflict = await updateList(list!.id, secondData, {
        ...operationEnvelope,
        payload: secondData,
      });

      expect(conflict.model).toBeUndefined();
      expect(conflict.message).toBe("Operation payload does not match existing operationId");
      expect(conflict.status).toBe(409);
    });

  });

  describe("deleteList", () => {

    it("should fail on invalid list ID", async () => {

      const result = await deleteList("not-a-uuid");

      expect(result.message).toBe(ERRORS.ID_VALIDATION);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(400);

    });

    it("should fail on unauthenticated user", async () => {

      const adminProfile = await lookupProfileByEmail(PROFILES[1]!.email!);
      const list = await lookupListByRole(adminProfile!, MemberRole.ADMIN);

      const result = await deleteList(list!.id);

      expect(result.message).toBe(ERRORS.AUTHENTICATION);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(401);

    });

    it("should fail on unauthorized user", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const list = await lookupListByRole(guestProfile!, MemberRole.GUEST);
      setProfile(guestProfile);

      const result = await deleteList(list!.id);

      expect(result.message).toBe(NOT_AUTHORIZED_MESSAGE);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(403);

    });

    it("should delete a list and all corresponding members for an ADMIN", async () => {

      const adminProfile = await lookupProfileByEmail(PROFILES[1]!.email!);
      const list = await lookupListByRole(adminProfile!, MemberRole.ADMIN);
      setProfile(adminProfile);

      const countBefore = await db.member.count({
        where: {
          listId: list!.id,
        },
      });
      expect(countBefore).toBeGreaterThan(1);

      const result = await deleteList(list!.id);

      expect(result.model).toBeDefined();
      expect(result.model!.id).toBe(list!.id);

      const deletedList = await db.list.findUnique({
        where: {
          id: list!.id,
        },
      });
      expect(deletedList).toBeNull();

      const countAfter = await db.member.count({
        where: {
          listId: list!.id,
        },
      });
      expect(countAfter).toBe(0);

    });

    it("replays duplicate deleteList with same payload", async () => {

      const adminProfile = await lookupProfileByEmail(PROFILES[1]!.email!);
      const list = await lookupListByRole(adminProfile!, MemberRole.ADMIN);
      setProfile(adminProfile);
      const operationEnvelope = makeEnvelope("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", "deleteList", { listId: list!.id });

      const first = await deleteList(list!.id, operationEnvelope);
      const second = await deleteList(list!.id, operationEnvelope);

      expect(first.model).toBeDefined();
      expect(second).toEqual(first);

      const deletedList = await db.list.findUnique({
        where: {
          id: list!.id,
        },
      });
      expect(deletedList).toBeNull();
    });

    it("rejects duplicate deleteList with mismatched payload", async () => {

      const adminProfile = await lookupProfileByEmail(PROFILES[1]!.email!);
      const list = await lookupListByRole(adminProfile!, MemberRole.ADMIN);
      setProfile(adminProfile);
      const operationEnvelope = makeEnvelope("ffffffff-ffff-4fff-8fff-ffffffffffff", "deleteList", { listId: list!.id });
      const differentListId = "99999999-9999-4999-8999-999999999999";

      await deleteList(list!.id, operationEnvelope);
      const conflict = await deleteList(differentListId, operationEnvelope);

      expect(conflict.model).toBeUndefined();
      expect(conflict.message).toBe("Operation payload does not match existing operationId");
      expect(conflict.status).toBe(409);
    });

  });

});

function makeEnvelope(operationId: string, operationType: "createList" | "deleteList" | "updateList", payload: unknown) {
  return {
    clientTimestamp: new Date("2026-06-14T00:00:00.000Z"),
    operationId,
    operationType,
    payload,
    schemaVersion: OPERATION_ENVELOPE_SCHEMA_VERSION,
  };
}

