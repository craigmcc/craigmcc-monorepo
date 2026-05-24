/**
 * Better-Auth client side configuration.
 */

// Exzternal Modules ---------------------------------------------------------

import { createAuthClient } from "better-auth/react";

// Public Objects -----------------------------------------------------------

export const authClient = createAuthClient({
  basePath: "/api/auth",
  // Keep this explicit so client calls always target your app auth endpoint.
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});
