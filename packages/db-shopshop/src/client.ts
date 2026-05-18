/**
 * Prisma Client for db-shopshop.
 */

// External Modules ----------------------------------------------------------

import { PrismaPg } from "@prisma/adapter-pg";

// Internal Modules ----------------------------------------------------------

import { PrismaClient } from "../generated/prisma";

// Public Objects ------------------------------------------------------------

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

let globalForPrisma =
  globalThis as unknown as { prisma: PrismaClient };

export const dbShopShop  =
  globalForPrisma ||
  new PrismaClient({
    adapter
  });

if (process.env.NODE_ENV !== "production") globalForPrisma = dbShopShop;
