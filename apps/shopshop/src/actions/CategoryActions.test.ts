/**
 * Functional tests for CategoryActions.
 */

// External Imports ----------------------------------------------------------

import { ERRORS } from "@repo/daisy-form/ActionResult";
import { dbShopShop as db, MemberRole } from "@repo/db-shopshop";
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

  });

});

