/**
 * Functional tests for ListActions.
 */

// External Imports ----------------------------------------------------------

import { ERRORS } from "@repo/daisy-form/ActionResult";
import { dbShopShop as db, MemberRole } from "@repo/db-shopshop";
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

  });

});

