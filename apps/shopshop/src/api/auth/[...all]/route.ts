/**
 * Better-Auth route for authentication endpoints.
 */

// External Modules ----------------------------------------------------------

import { toNextJsHandler } from "better-auth/next-js";

// Internal Modules ----------------------------------------------------------

import { auth } from "@/auth/auth-server";

// Public Objects ------------------------------------------------------------

export const { GET, POST } = toNextJsHandler(auth);
