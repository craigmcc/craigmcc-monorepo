/**
 * Functional tests for ProfileActions.
 */

// External Imports ----------------------------------------------------------

import { ERRORS } from "@repo/daisy-form/ActionResult";
import { ProfileUpdateSchemaType } from "@repo/db-shopshop/zod-schemas/ProfileSchema";
import { beforeEach, describe, expect, it, /*vi*/ } from "vitest";

// Internal Imports ----------------------------------------------------------

import { updateProfile } from "@/actions/ProfileActions";
import { lookupProfileByEmail } from "@/lib/ProfileHelpers";
import { setProfile } from "@/lib/ProfileServerHelper";
import { BaseUtils } from "@/test/BaseUtils";
import { PROFILES } from "@/test/SeedData";

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
