/**
 * Helpers for looking up Category and Item models.
 */

// External Modules ----------------------------------------------------------

import { dbShopShop as db, Category, Item, List, MemberRole, Profile } from "@repo/db-shopshop";

// Public Objects ------------------------------------------------------------

/**
 * Look up and return the first Category with the specified id.
 */
export async function lookupCategoryById(categoryId: string): Promise<Category | null> {
  return db.category.findUnique({
    where: {
      id: categoryId,
    },
  });
}

/**
 * Look up and return the first Category that belongs to the specified List
 * and has the specified name.
 */
export async function lookupCategoryByName(list: List, name: string): Promise<Category | null> {
  return db.category.findFirst({
    where: {
      listId: list.id,
      name,
    },
  });
}

/**
 * Look up and return the first Category for which the specified Profile is a
 * Member with the specified Role (or not a Member if role is null).
 */
export async function lookupCategoryByRole(profile: Profile, role: MemberRole | null): Promise<Category | null> {
  if (role) {
    return db.category.findFirst({
      where: {
        list: {
          members: {
            some: {
              profileId: profile.id,
              role,
            },
          },
        },
      },
    });
  }

  return db.category.findFirst({
    where: {
      list: {
        members: {
          none: {
            profileId: profile.id,
          },
        },
      },
    },
  });
}

/**
 * Look up and return the first Item with the specified id.
 */
export async function lookupItemById(itemId: string): Promise<Item | null> {
  return db.item.findUnique({
    where: {
      id: itemId,
    },
  });
}

/**
 * Look up and return the first Item that belongs to the specified Category
 * and has the specified name.
 */
export async function lookupItemByName(category: Category, name: string): Promise<Item | null> {
  return db.item.findFirst({
    where: {
      categoryId: category.id,
      name,
    },
  });
}

/**
 * Look up and return the first Item for which the specified Profile is a
 * Member with the specified Role (or not a Member if role is null).
 */
export async function lookupItemByRole(profile: Profile, role: MemberRole | null): Promise<Item | null> {
  if (role) {
    return db.item.findFirst({
      where: {
        category: {
          list: {
            members: {
              some: {
                profileId: profile.id,
                role,
              },
            },
          },
        },
      },
    });
  }

  return db.item.findFirst({
    where: {
      category: {
        list: {
          members: {
            none: {
              profileId: profile.id,
            },
          },
        },
      },
    },
  });
}

