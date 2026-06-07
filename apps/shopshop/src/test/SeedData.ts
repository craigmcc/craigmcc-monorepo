// @/test/SeedData.ts

/**
 * Seed data for testing purposes.
 *
 * @packageDocumentation
 */

// External Modules ----------------------------------------------------------

import type { List, Profile } from "@repo/db-shopshop/types";

// Internal Modules ----------------------------------------------------------

// Public Objects ------------------------------------------------------------

// ***** Categories ***** Will be seeded programmatically

// ***** Items ***** Will be seeded programmatically

// ***** Lists *****

export const LIST_NAME_FIRST = "First List";
export const LIST_NAME_SECOND = "Second List";
export const LIST_NAME_THIRD = "Third List";

export const LISTS: Partial<List>[] = [
    {
        name: LIST_NAME_FIRST,
        private: false,
    },
    {
        name: LIST_NAME_SECOND,
        private: false,
    },
    {
        name: LIST_NAME_THIRD,
        private: false,
    },
];

// ***** Members ***** Will be seeded programmatically

// ***** Profiles *****

export const PROFILE_EMAIL_FIRST = "first@example.com";
export const PROFILE_EMAIL_SECOND = "second@example.com";
export const PROFILE_EMAIL_THIRD = "third@example.com";
export const PROFILE_NAME_FIRST = "First Profile";
export const PROFILE_NAME_SECOND = "Second Profile";
export const PROFILE_NAME_THIRD = "Third Profile";

export const PROFILES: Partial<Profile>[] = [
    {
        email: PROFILE_EMAIL_FIRST,
        name: PROFILE_NAME_FIRST,
    },
    {
        email: PROFILE_EMAIL_SECOND,
        name: PROFILE_NAME_SECOND,
    },
    {
        email: PROFILE_EMAIL_THIRD,
        name: PROFILE_NAME_THIRD,
    },
];


