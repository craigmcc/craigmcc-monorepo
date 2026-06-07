/**
 * Functional tests for ItemActions.
 */

// External Imports ----------------------------------------------------------

import { ERRORS } from "@repo/daisy-form/ActionResult";
import { MemberRole } from "@repo/db-shopshop/enums";
import {
  ItemCreateSchemaType,
  ItemUpdateSchemaType,
} from "@repo/db-shopshop/zod-schemas/ItemSchema";
import { beforeEach, describe, expect, it } from "vitest";

// Internal Imports ----------------------------------------------------------

import { createItem, deleteItem, updateItem } from "@/actions/ItemActions";
import {
  lookupCategoryByRole,
  lookupItemById,
  lookupItemByRole,
} from "@/lib/CategoryHelpers";
import { lookupListByRole } from "@/lib/ListHelpers";
import { lookupProfileByEmail } from "@/lib/ProfileHelpers";
import { setProfile } from "@/lib/ProfileServerHelper";
import { BaseUtils } from "@/test/BaseUtils";
import { PROFILES } from "@/test/SeedData";

const CATEGORY_LIST_MISMATCH_MESSAGE = "Specified Category does not belong to the specified List";
const NO_CATEGORY_MESSAGE = "No Category found for the specified ID";
const NO_ITEM_MESSAGE = "No Item found for the specified ID";
const NOT_AUTHORIZED_MESSAGE = "This Profile is not authorized to perform this action";
const UTILS = new BaseUtils();

// Test Specifications -------------------------------------------------------

describe("ItemActions", () => {

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

  describe("createItem", () => {

    it("should fail on unauthenticated user", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestCategory = await lookupCategoryByRole(guestProfile!, MemberRole.GUEST);
      const data: ItemCreateSchemaType = {
        categoryId: guestCategory!.id,
        listId: guestCategory!.listId,
        name: "Quick Milk",
      };

      const result = await createItem(data);

      expect(result.message).toBe(ERRORS.AUTHENTICATION);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(401);

    });

    it("should fail on invalid item data", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestCategory = await lookupCategoryByRole(guestProfile!, MemberRole.GUEST);
      setProfile(guestProfile);
      const data: ItemCreateSchemaType = {
        categoryId: guestCategory!.id,
        listId: guestCategory!.listId,
        name: "",
      };

      const result = await createItem(data);

      expect(result.message).toBe(ERRORS.DATA_VALIDATION);
      expect(result.fieldErrors).toBeDefined();
      expect(result.status).toBe(400);

    });

    it("should fail when the category does not exist", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestList = await lookupListByRole(guestProfile!, MemberRole.GUEST);
      setProfile(guestProfile);
      const data: ItemCreateSchemaType = {
        categoryId: "00000000-0000-0000-0000-000000000000",
        listId: guestList!.id,
        name: "Missing Category Item",
      };

      const result = await createItem(data);

      expect(result.message).toBe(NO_CATEGORY_MESSAGE);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(404);

    });

    it("should fail when the category belongs to a different list", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestCategory = await lookupCategoryByRole(guestProfile!, MemberRole.GUEST);
      const adminList = await lookupListByRole(guestProfile!, MemberRole.ADMIN);
      setProfile(guestProfile);
      const data: ItemCreateSchemaType = {
        categoryId: guestCategory!.id,
        listId: adminList!.id,
        name: "Wrong List Item",
      };

      const result = await createItem(data);

      expect(result.message).toBe(CATEGORY_LIST_MISMATCH_MESSAGE);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(400);

    });

    it("should fail on unauthorized user", async () => {

      const nonmemberProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const nonmemberList = await lookupListByRole(nonmemberProfile!, null);
      const adminProfile = await lookupProfileByEmail(PROFILES[1]!.email!);
      const adminCategory = await lookupCategoryByRole(adminProfile!, MemberRole.ADMIN);
      setProfile(nonmemberProfile);
      const data: ItemCreateSchemaType = {
        categoryId: adminCategory!.id,
        listId: nonmemberList!.id,
        name: "Not Allowed",
      };

      const result = await createItem(data);

      expect(result.message).toBe(NOT_AUTHORIZED_MESSAGE);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(403);

    });

    it("should create an item for a GUEST member", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestCategory = await lookupCategoryByRole(guestProfile!, MemberRole.GUEST);
      setProfile(guestProfile);
      const data: ItemCreateSchemaType = {
        categoryId: guestCategory!.id,
        checked: true,
        listId: guestCategory!.listId,
        name: "Quick Milk",
        notes: "2%",
        quantity: 2,
        selected: true,
      };

      const result = await createItem(data);

      expect(result.model).toBeDefined();
      expect(result.model!.categoryId).toBe(guestCategory!.id);
      expect(result.model!.listId).toBe(guestCategory!.listId);
      expect(result.model!.name).toBe(data.name);
      expect(result.model!.notes).toBe(data.notes);
      expect(result.model!.quantity).toBe(data.quantity);
      expect(result.model!.checked).toBe(true);
      expect(result.model!.selected).toBe(true);

      const createdItem = await lookupItemById(result.model!.id);
      expect(createdItem).not.toBeNull();
      expect(createdItem!.name).toBe(data.name);

    });

  });

  describe("updateItem", () => {

    it("should fail on invalid item ID", async () => {

      const result = await updateItem("not-a-uuid", {});

      expect(result.message).toBe(ERRORS.ID_VALIDATION);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(400);

    });

    it("should fail on unauthenticated user", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestItem = await lookupItemByRole(guestProfile!, MemberRole.GUEST);

      const result = await updateItem(guestItem!.id, {
        name: "Updated Item",
      });

      expect(result.message).toBe(ERRORS.AUTHENTICATION);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(401);

    });

    it("should fail when the item does not exist", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      setProfile(guestProfile);

      const result = await updateItem("00000000-0000-0000-0000-000000000000", {
        name: "Missing Item",
      });

      expect(result.message).toBe(NO_ITEM_MESSAGE);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(404);

    });

    it("should fail on unauthorized user", async () => {

      const nonmemberProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const nonmemberItem = await lookupItemByRole(nonmemberProfile!, null);
      setProfile(nonmemberProfile);

      const result = await updateItem(nonmemberItem!.id, {
        name: "Not Allowed",
      });

      expect(result.message).toBe(NOT_AUTHORIZED_MESSAGE);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(403);

    });

    it("should fail on invalid update data", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestItem = await lookupItemByRole(guestProfile!, MemberRole.GUEST);
      setProfile(guestProfile);
      const data: ItemUpdateSchemaType = {
        name: "",
      };

      const result = await updateItem(guestItem!.id, data);

      expect(result.message).toBe(ERRORS.DATA_VALIDATION);
      expect(result.fieldErrors).toBeDefined();
      expect(result.status).toBe(400);

    });

    it("should update an item for a GUEST member", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestItem = await lookupItemByRole(guestProfile!, MemberRole.GUEST);
      setProfile(guestProfile);
      const data: ItemUpdateSchemaType = {
        checked: true,
        name: "Updated Item",
        notes: "Fresh only",
        quantity: 3,
        selected: true,
      };

      const result = await updateItem(guestItem!.id, data);

      expect(result.model).toBeDefined();
      expect(result.model!.id).toBe(guestItem!.id);
      expect(result.model!.name).toBe(data.name);
      expect(result.model!.notes).toBe(data.notes);
      expect(result.model!.quantity).toBe(data.quantity);
      expect(result.model!.checked).toBe(true);
      expect(result.model!.selected).toBe(true);
      expect(result.model!.categoryId).toBe(guestItem!.categoryId);
      expect(result.model!.listId).toBe(guestItem!.listId);

    });

  });

  describe("deleteItem", () => {

    it("should fail on invalid item ID", async () => {

      const result = await deleteItem("not-a-uuid");

      expect(result.message).toBe(ERRORS.ID_VALIDATION);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(400);

    });

    it("should fail on unauthenticated user", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestItem = await lookupItemByRole(guestProfile!, MemberRole.GUEST);

      const result = await deleteItem(guestItem!.id);

      expect(result.message).toBe(ERRORS.AUTHENTICATION);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(401);

    });

    it("should fail when the item does not exist", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      setProfile(guestProfile);

      const result = await deleteItem("00000000-0000-0000-0000-000000000000");

      expect(result.message).toBe(NO_ITEM_MESSAGE);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(404);

    });

    it("should fail on unauthorized user", async () => {

      const nonmemberProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const nonmemberItem = await lookupItemByRole(nonmemberProfile!, null);
      setProfile(nonmemberProfile);

      const result = await deleteItem(nonmemberItem!.id);

      expect(result.message).toBe(NOT_AUTHORIZED_MESSAGE);
      expect(result.model).toBeUndefined();
      expect(result.status).toBe(403);

    });

    it("should delete an item for a GUEST member", async () => {

      const guestProfile = await lookupProfileByEmail(PROFILES[0]!.email!);
      const guestItem = await lookupItemByRole(guestProfile!, MemberRole.GUEST);
      setProfile(guestProfile);

      const result = await deleteItem(guestItem!.id);

      expect(result.model).toBeDefined();
      expect(result.model!.id).toBe(guestItem!.id);

      const deletedItem = await lookupItemById(guestItem!.id);
      expect(deletedItem).toBeNull();

    });

  });

});


