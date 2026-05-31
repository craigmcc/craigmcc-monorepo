/**
 * Compatibility shim for older action tests.
 *
 * New tests should use `BaseUtils` for data loading and the shared lookup
 * helpers in `@/lib/*Helpers` directly.
 */

// Internal Imports ----------------------------------------------------------

import { BaseUtils } from "@/test/BaseUtils";

// Public Objects ------------------------------------------------------------

export { BaseUtils as ActionUtils };
