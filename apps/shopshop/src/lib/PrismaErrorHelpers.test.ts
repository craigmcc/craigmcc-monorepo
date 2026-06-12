/**
 * Tests for Prisma error parsing helper functions.
 */

// External Imports ----------------------------------------------------------

import { describe, expect, it } from "vitest";

// Internal Imports ----------------------------------------------------------

import {
  extractPrismaUniqueConstraintTargets,
  isPrismaForeignKeyConstraintError,
  isPrismaRecordNotFoundError,
  isPrismaUniqueConstraintError,
} from "@/lib/PrismaErrorHelpers";

// Test Specifications -------------------------------------------------------

describe("PrismaErrorHelpers", () => {

  describe("error code checks", () => {

    it("returns true for P2003 foreign key errors", () => {
      expect(isPrismaForeignKeyConstraintError({ code: "P2003" })).toBe(true);
      expect(isPrismaForeignKeyConstraintError({ code: "P2002" })).toBe(false);
    });

    it("returns true for P2025 record-not-found errors", () => {
      expect(isPrismaRecordNotFoundError({ code: "P2025" })).toBe(true);
      expect(isPrismaRecordNotFoundError({ code: "P2002" })).toBe(false);
    });

    it("returns true for P2002 unique-constraint errors", () => {
      expect(isPrismaUniqueConstraintError({ code: "P2002" })).toBe(true);
      expect(isPrismaUniqueConstraintError({ code: "P2003" })).toBe(false);
    });

  });

  describe("extractPrismaUniqueConstraintTargets", () => {

    it("returns direct Prisma meta.target fields for P2002 errors", () => {
      const targets = extractPrismaUniqueConstraintTargets({
        code: "P2002",
        meta: {
          target: ["actorProfileId", "operationId"],
        },
      });

      expect(targets).toEqual(["actorProfileId", "operationId"]);
    });

    it("returns adapter constraint fields for P2002 errors", () => {
      const targets = extractPrismaUniqueConstraintTargets({
        code: "P2002",
        meta: {
          driverAdapterError: {
            cause: {
              constraint: {
                fields: ["actor_profile_id", "operation_id"],
              },
            },
          },
        },
      });

      expect(targets).toEqual(["actor_profile_id", "operation_id"]);
    });

    it("returns empty array for non-P2002 errors", () => {
      const targets = extractPrismaUniqueConstraintTargets({
        code: "P2003",
        meta: {
          target: ["actorProfileId", "operationId"],
        },
      });

      expect(targets).toEqual([]);
    });

  });

});


