/**
 * Extended model types for the ShopShop application.  These definitions allow
 * TypeScript to recognize related objects when utilizing Prisma's "include"
 * directives to perform joins at the database level.
 */

// External Modules ----------------------------------------------------------

import type {
  Category,
  Item,
  List,
  Member,
  Profile,
} from "@repo/db-shopshop/types";

// Internal Modules ----------------------------------------------------------

// Public Objects ------------------------------------------------------------

export type CategoryPlus = Category & {
  items?: ItemPlus[];
  list?: List;
}

export type ItemPlus = Item & {
  category?: CategoryPlus;
  list?: ListPlus;
}

export type ListPlus = List & {
  categories?: CategoryPlus[];
  items?: ItemPlus[];
  members?: MemberPlus[];
}

export type MemberPlus = Member & {
  profile?: ProfilePlus;
  list?: ListPlus;
}

export type ProfilePlus = Profile & {
  lists?: ListPlus[];
  members?: MemberPlus[];
}
