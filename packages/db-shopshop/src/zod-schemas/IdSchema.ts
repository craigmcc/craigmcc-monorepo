/**
 * Zod schema for generic IDs.
 */

// ExternalModules ----------------------------------------------------------

import * as z from "zod";

// Public Objects ------------------------------------------------------------

export const IdSchema = z.uuid("Invalid object ID");

export type IdSchemaType = z.infer<typeof IdSchema>;
