// NOTE: *Not* a "use server" file to prevent methods from being server actions

/**
 * Helpers for looking up and populating List-related models.
 */

// External Modules ----------------------------------------------------------

import { dbShopShop as db } from "@repo/db-shopshop";
import { MemberRole } from "@repo/db-shopshop/enums";
import type { Category, Item, List, Member, Profile } from "@repo/db-shopshop/types";
import { type CategoryCreateSchemaType } from "@repo/db-shopshop/zod-schemas/CategorySchema";
import { type ItemCreateSchemaType } from "@repo/db-shopshop/zod-schemas/ItemSchema";

// Internal Modules ----------------------------------------------------------

import { InitialListData } from "@/lib/InitialListData";

// Public Objects ------------------------------------------------------------

type PopulateListClient = Pick<typeof db, "category" | "item">;

/**
 * Look up and return the first List with the specified id.
 */
export async function lookupListById(listId: string): Promise<List | null> {
  return db.list.findUnique({
    where: {
      id: listId,
    },
  });
}

/**
 * Look up and return the first List with the specified name.
 */
export async function lookupListByName(name: string): Promise<List | null> {
  return db.list.findFirst({
    where: {
      name,
    },
  });
}

/**
 * Look up and return the first List for which the specified Profile is a
 * Member with the specified Role (or not a Member if role is null).
 */
export async function lookupListByRole(profile: Profile, role: MemberRole | null): Promise<List | null> {
  if (role) {
    return db.list.findFirst({
      where: {
        members: {
          some: {
            profileId: profile.id,
            role,
          },
        },
      },
    });
  }

  return db.list.findFirst({
    where: {
      members: {
        none: {
          profileId: profile.id,
        },
      },
    },
  });
}

/**
 * Look up and return the Member relationship between the specified List and
 * Profile.
 */
export async function lookupListMembership(listId: string, profileId: string): Promise<Member | null> {
  return db.member.findFirst({
    where: {
      listId,
      profileId,
    },
  });
}

/**
 * Populate the Category and Item models for a new List.
 *
 * @param listId                        ID of the List to be populated
 * @param withCategories                Should we include Categories?
 * @param withItems                     Should we include Items?  (implies withCategories)
 *
 * @returns                             Newly created Categories and Items
 */
export async function populateList(
  listId: string,
  withCategories: boolean,
  withItems: boolean,
  client: PopulateListClient = db,
) {

  // Create each defined Category
  const categories: Category[] = [];
  if (withCategories || withItems) {
    for (const element of InitialListData) {
      const category: CategoryCreateSchemaType = {
        listId: listId,
        name: element[0]!,
      }
      categories.push(await client.category.create({ data: category }));
    }
  }

  // For each created category, create the relevant Items
  const items: Item[] = [];
  if (withItems) {
    for (let i = 0; i < InitialListData.length; i++) {
      const element = InitialListData[i];
      if (element!.length > 1) {
        for (let j = 1; j < element!.length; j++) {
          const item: ItemCreateSchemaType = {
            categoryId: categories[i]!.id,
            checked: false,
            listId: listId,
            name: element![j] ?? "Unknown Item",
            selected: false,
          }
          items.push(await client.item.create({ data: item }));
        }
      }
    }
  }

  return { categories, items };

}
