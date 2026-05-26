/**
 * Better-Auth client side configuration.
 */

// External Modules ----------------------------------------------------------

import { createAuthClient } from "better-auth/react";
import { customSessionClient } from "better-auth/client/plugins";
import type { auth } from "@/auth/auth-server";

// Public Objects -----------------------------------------------------------

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  basePath: "/api/auth",
  plugins: [
    customSessionClient<typeof auth>(),
  ],
});

// Public Exports ------------------------------------------------------------

// Convenience exports for components/hooks.
export const { getSession, signIn, signOut, signUp, useSession } = authClient;
