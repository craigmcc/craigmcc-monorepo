/**
 * Better-Auth client side configuration.
 */

// External Modules ----------------------------------------------------------

import { customSessionClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "@/auth/auth-server";

// Public Objects -----------------------------------------------------------

type AuthClientOptions = {
  basePath: string;
  baseURL: string;
  plugins: [ReturnType<typeof customSessionClient<typeof auth>>];
};

const authClientOptions: AuthClientOptions = {
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  basePath: "/api/auth",
  plugins: [
    customSessionClient<typeof auth>(),
  ],
};

type AuthClientType = ReturnType<typeof createAuthClient<AuthClientOptions>>;

const authClient: AuthClientType = createAuthClient(authClientOptions);

// Public Exports ------------------------------------------------------------

// Convenience exports for components/hooks.
export const getSession: AuthClientType["getSession"] = authClient.getSession;
export const signIn: AuthClientType["signIn"] = authClient.signIn;
export const signOut: AuthClientType["signOut"] = authClient.signOut;
export const signUp: AuthClientType["signUp"] = authClient.signUp;
export const useSession: AuthClientType["useSession"] = authClient.useSession;
