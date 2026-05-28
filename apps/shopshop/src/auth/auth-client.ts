/**
 * Better-Auth client-side configuration.
 */

// External Imports ----------------------------------------------------------

import { customSessionClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Internal Imports ----------------------------------------------------------

import type { auth } from "@/auth/auth-server";

// Private Objects -----------------------------------------------------------

type AuthClientPlugin = ReturnType<typeof customSessionClient<typeof auth>>;

type AuthClientOptions = {
  basePath: string;
  baseURL: string;
  plugins: [AuthClientPlugin];
};

type AuthClientType = ReturnType<typeof createAuthClient<AuthClientOptions>>;

const authClientOptions: AuthClientOptions = {
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  basePath: "/api/auth",
  plugins: [
    customSessionClient<typeof auth>(),
  ],
};

const authClient: AuthClientType = createAuthClient(authClientOptions);

// Public Objects ------------------------------------------------------------

export const getSession: AuthClientType["getSession"] = authClient.getSession;
export const signIn: AuthClientType["signIn"] = authClient.signIn;
export const signOut: AuthClientType["signOut"] = authClient.signOut;
export const signUp: AuthClientType["signUp"] = authClient.signUp;
export const useSession: AuthClientType["useSession"] = authClient.useSession;
