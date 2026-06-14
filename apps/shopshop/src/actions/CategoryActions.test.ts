/**
 * Functional tests for CategoryActions.
 */

// External Imports ----------------------------------------------------------

import { ERRORS } from "@repo/daisy-form/ActionResult";
import { dbShopShop as db } from "@repo/db-shopshop";
import { MemberRole } from "@repo/db-shopshop/enums";
import {
  CategoryCreateSchemaType,
  CategoryUpdateSchemaType,
} from "@repo/db-shopshop/zod-schemas/CategorySchema";
import { beforeEach, describe, expect, it } from "vitest";

// Internal Imports ----------------------------------------------------------

import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/actions/CategoryActions";
import {
  lookupCategoryById,
  lookupCategoryByRole,
} from "@/lib/CategoryHelpers";
import { lookupListByRole } from "@/lib/ListHelpers";
import { lookupProfileByEmail } from "@/lib/ProfileHelpers";
import { setProfile } from "@/lib/ProfileServerHelper";
import { BaseUtils } from "@/test/BaseUtils";
import { PROFILES } from "@/test/SeedData";
import { OPERATION_ENVELOPE_SCHEMA_VERSION } from "@/types/OperationEnvelope";

const NO_CATEGORY_MESSAGE = "No Category found for the specified ID";
const NOT_AUTHORIZED_MESSAGE = "This Profile is not authorized to perform this action";
const UTILS = new BaseUtils();

// Test Specifications -------------------------------------------------------

describe("CategoryActions", () => {

  // Test Hooks --------------------------------------------------------------

  beforeEach(async () => {
    setProfile(null);
    await UTILS.loadData({
      withCategories: true,
      withItems: true,
      withLists: true,
      withMembers: true,
      withProfiles: true,
    });
  });

  // Test Cases --------------------------------------------------------------

  describe("createCategory", () => {

    it("should fail on unauthenticated user", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestList = await lookupListByRole(guestProfile!, MemberRole.GUEST);
      const data: CategoryCreateSchemaType = {
        listId: guestList!.id,
        name: "Quick Errands",
      };

      const result = await createCategory(data);

      expect(result.message).toBe(ERRORS.AUTHENTICATION);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(401);

    });

    it("should fail on invalid category data", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestList = await lookupListByRole(guestProfile!, MemberRole.GUEST);
      setProfile(guestProfile);
      const data: CategoryCreateSchemaType = {
        listId: guestList!.id,
        name: "",
      };

      const result = await createCategory(data);

      expect(result.message).toBe(ERRORS.DATA_VALIDATION);
      expect(result.fieldErrors).toBeDefined();
      expect(result.status).toBe(400);

    });

    it("should fail on unauthorized user", async () => {

      const nonmemberProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const nonmemberList = await lookupListByRole(nonmemberProfile!, null);
      setProfile(nonmemberProfile);
      const data: CategoryCreateSchemaType = {
        listId: nonmemberList!.id,
        name: "Not Allowed",
      };

      const result = await createCategory(data);

      expect(result.message).toBe(NOT_AUTHORIZED_MESSAGE);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(403);

    });

    it("should create a category for a GUEST member", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestList = await lookupListByRole(guestProfile!, MemberRole.GUEST);
      setProfile(guestProfile);
      const data: CategoryCreateSchemaType = {
        listId: guestList!.id,
        name: "Quick Errands",
      };

      const result = await createCategory(data);

      expect(result.model).toBeDefined();
      expect(result.model!.listId).toBe(guestList!.id);
      expect(result.model!.name).toBe(data.name);

      const createdCategory = await lookupCategoryById(result.model!.id);
      expect(createdCategory).not.toBeNull();
      expect(createdCategory!.name).toBe(data.name);

    });

    it("replays duplicate createCategory with same payload", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestList = await lookupListByRole(guestProfile!, MemberRole.GUEST);
      setProfile(guestProfile);
      const data: CategoryCreateSchemaType = {
        listId: guestList!.id,
        name: "Idempotent Category",
      };
      const operationEnvelope = makeEnvelope("11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "createCategory", data);
      const categoryCountBefore = await db.category.count({
        where: {
          listId: guestList!.id,
        },
      });

      const first = await createCategory(data, operationEnvelope);
      const second = await createCategory(data, operationEnvelope);

      const categoryCountAfter = await db.category.count({
        where: {
          listId: guestList!.id,
        },
      });
      expect(first.model).toBeDefined();
      expect(second).toEqual(first);
      expect(categoryCountAfter).toBe(categoryCountBefore + 1);
    });

    it("rejects duplicate createCategory with mismatched payload", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestList = await lookupListByRole(guestProfile!, MemberRole.GUEST);
      setProfile(guestProfile);
      const firstData: CategoryCreateSchemaType = {
        listId: guestList!.id,
        name: "First Category Payload",
      };
      const secondData: CategoryCreateSchemaType = {
        listId: guestList!.id,
        name: "Second Category Payload",
      };
      const operationEnvelope = makeEnvelope("22222222-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "createCategory", firstData);

      await createCategory(firstData, operationEnvelope);
      const conflict = await createCategory(secondData, operationEnvelope);

      expect(conflict.model).toBeUndefined();
      expect(conflict.message).toBe("Operation payload does not match existing operationId");
      expect(conflict.status).toBe(409);
    });

  });

  describe("updateCategory", () => {

    it("should fail on invalid category ID", async () => {

      const result = await updateCategory("not-a-uuid", {});

      expect(result.message).toBe(ERRORS.ID_VALIDATION);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(400);

    });

    it("should fail on unauthenticated user", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestCategory = await lookupCategoryByRole(guestProfile!, MemberRole.GUEST);

      const result = await updateCategory(guestCategory!.id, {
        name: "Updated Category",
      });

      expect(result.message).toBe(ERRORS.AUTHENTICATION);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(401);

    });

    it("should fail when the category does not exist", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      setProfile(guestProfile);

      const result = await updateCategory("00000000-0000-0000-0000-000000000000", {
        name: "Missing Category",
      });

      expect(result.message).toBe(NO_CATEGORY_MESSAGE);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(404);

    });

    it("should fail on unauthorized user", async () => {

      const nonmemberProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const nonmemberCategory = await lookupCategoryByRole(nonmemberProfile!, null);
      setProfile(nonmemberProfile);

      const result = await updateCategory(nonmemberCategory!.id, {
        name: "Not Allowed",
      });

      expect(result.message).toBe(NOT_AUTHORIZED_MESSAGE);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(403);

    });

    it("should fail on invalid update data", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestCategory = await lookupCategoryByRole(guestProfile!, MemberRole.GUEST);
      setProfile(guestProfile);
      const data: CategoryUpdateSchemaType = {
        name: "",
      };

      const result = await updateCategory(guestCategory!.id, data);

      expect(result.message).toBe(ERRORS.DATA_VALIDATION);
      expect(result.fieldErrors).toBeDefined();
      expect(result.status).toBe(400);

    });

    it("should update a category for a GUEST member", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestCategory = await lookupCategoryByRole(guestProfile!, MemberRole.GUEST);
      setProfile(guestProfile);
      const data: CategoryUpdateSchemaType = {
        name: "Updated Category",
      };

      const result = await updateCategory(guestCategory!.id, data);

      expect(result.model).toBeDefined();
      expect(result.model!.id).toBe(guestCategory!.id);
      expect(result.model!.name).toBe(data.name);
      expect(result.model!.listId).toBe(guestCategory!.listId);

    });

    it("replays duplicate updateCategory with same payload", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestCategory = await lookupCategoryByRole(guestProfile!, MemberRole.GUEST);
      setProfile(guestProfile);
      const data: CategoryUpdateSchemaType = {
        name: "Replay Update Category",
      };
      const operationEnvelope = makeEnvelope("33333333-cccc-4ccc-8ccc-cccccccccccc", "updateCategory", data);

      const first = await updateCategory(guestCategory!.id, data, operationEnvelope);
      const second = await updateCategory(guestCategory!.id, data, operationEnvelope);

      expect(first.model).toBeDefined();
      expect(second).toEqual(first);
    });

    it("rejects duplicate updateCategory with mismatched payload", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestCategory = await lookupCategoryByRole(guestProfile!, MemberRole.GUEST);
      setProfile(guestProfile);
      const firstData: CategoryUpdateSchemaType = {
        name: "First Update Category",
      };
      const secondData: CategoryUpdateSchemaType = {
        name: "Second Update Category",
      };
      const operationEnvelope = makeEnvelope("44444444-dddd-4ddd-8ddd-dddddddddddd", "updateCategory", firstData);

      await updateCategory(guestCategory!.id, firstData, operationEnvelope);
      const conflict = await updateCategory(guestCategory!.id, secondData, operationEnvelope);

      expect(conflict.model).toBeUndefined();
      expect(conflict.message).toBe("Operation payload does not match existing operationId");
      expect(conflict.status).toBe(409);
    });

  });

  describe("deleteCategory", () => {

    it("should fail on invalid category ID", async () => {

      const result = await deleteCategory("not-a-uuid");

      expect(result.message).toBe(ERRORS.ID_VALIDATION);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(400);

    });

    it("should fail on unauthenticated user", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestCategory = await lookupCategoryByRole(guestProfile!, MemberRole.GUEST);

      const result = await deleteCategory(guestCategory!.id);

      expect(result.message).toBe(ERRORS.AUTHENTICATION);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(401);

    });

    it("should fail when the category does not exist", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      setProfile(guestProfile);

      const result = await deleteCategory("00000000-0000-0000-0000-000000000000");

      expect(result.message).toBe(NO_CATEGORY_MESSAGE);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(404);

    });

    it("should fail on unauthorized user", async () => {

      const nonmemberProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const nonmemberCategory = await lookupCategoryByRole(nonmemberProfile!, null);
      setProfile(nonmemberProfile);

      const result = await deleteCategory(nonmemberCategory!.id);

      expect(result.message).toBe(NOT_AUTHORIZED_MESSAGE);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(403);

    });

    it("should delete a category and its items for a GUEST member", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestCategory = await lookupCategoryByRole(guestProfile!, MemberRole.GUEST);
      setProfile(guestProfile);

      const itemCountBefore = await db.item.count({
        where: {
          categoryId: guestCategory!.id,
        },
      });
      expect(itemCountBefore).toBeGreaterThan(0);

      const result = await deleteCategory(guestCategory!.id);

      expect(result.model).toBeDefined();
      expect(result.model!.id).toBe(guestCategory!.id);

      const deletedCategory = await lookupCategoryById(guestCategory!.id);
      expect(deletedCategory).toBeNull();

      const itemCountAfter = await db.item.count({
        where: {
          categoryId: guestCategory!.id,
        },
      });
      expect(itemCountAfter).toBe(0);

    });

    it("replays duplicate deleteCategory with same payload", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestCategory = await lookupCategoryByRole(guestProfile!, MemberRole.GUEST);
      setProfile(guestProfile);
      const operationEnvelope = makeEnvelope("55555555-eeee-4eee-8eee-eeeeeeeeeeee", "deleteCategory", {
        categoryId: guestCategory!.id,
      });

      const first = await deleteCategory(guestCategory!.id, operationEnvelope);
      const second = await deleteCategory(guestCategory!.id, operationEnvelope);

      expect(first.model).toBeDefined();
      expect(second).toEqual(first);
    });

    it("rejects duplicate deleteCategory with mismatched payload", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestCategory = await lookupCategoryByRole(guestProfile!, MemberRole.GUEST);
      setProfile(guestProfile);
      const operationEnvelope = makeEnvelope("66666666-ffff-4fff-8fff-ffffffffffff", "deleteCategory", {
        categoryId: guestCategory!.id,
      });
      const differentCategoryId = "99999999-9999-4999-8999-999999999999";

      await deleteCategory(guestCategory!.id, operationEnvelope);
      const conflict = await deleteCategory(differentCategoryId, operationEnvelope);

      expect(conflict.model).toBeUndefined();
      expect(conflict.message).toBe("Operation payload does not match existing operationId");
      expect(conflict.status).toBe(409);
    });

  });

});

function makeEnvelope(
  operationId: string,
  operationType: "createCategory" | "deleteCategory" | "updateCategory",
  payload: unknown,
) {
  return {
    clientTimestamp: new Date("2026-06-14T00:00:00.000Z"),
    operationId,
    operationType,
    payload,
    schemaVersion: OPERATION_ENVELOPE_SCHEMA_VERSION,
  };
}

