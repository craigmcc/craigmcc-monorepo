/**
 * Better-Auth server side configuration.
 */

// External Modules ----------------------------------------------------------

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

// Internal Modules ---------------------------------------------------------

import { dbShopShop } from "@repo/db-shopshop/client"

// Public Objects -----------------------------------------------------------

export const auth = betterAuth({
  database: prismaAdapter(dbShopShop, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true
  }
});
