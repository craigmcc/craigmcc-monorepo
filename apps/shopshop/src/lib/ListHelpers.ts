// NOTE: *Not* a "use server" file to prevent methods from being server actions

/**
 * Create the Category and Item models for a new List.
 */

// External Modules ----------------------------------------------------------

import { dbShopShop as db, Category, Item } from "@repo/db-shopshop";

// Internal Modules ----------------------------------------------------------

import { InitialListData } from "@/lib/InitialListData";
import { type CategoryCreateSchemaType } from "@repo/db-shopshop/zod-schemas/CategorySchema";
import { type ItemCreateSchemaType } from "@repo/db-shopshop/zod-schemas/ItemSchema";

// Public Objects ------------------------------------------------------------

/**
 * Populate the Category and Item models for a new List.
 *
 * @param listId                        ID of the List to be populated
 * @param withCategories                Should we include Categories?
 * @param withItems                     Should we include Items?  (implies withCategories)
 *
 * @returns                             Newly created Categories and Items
 */
export async function populateList(listId: string, withCategories: boolean, withItems: boolean) {

  // Create each defined Category
  const categories: Category[] = [];
  if (withCategories || withItems) {
    for (const element of InitialListData) {
      const category: CategoryCreateSchemaType = {
        listId: listId,
        name: element[0]!,
      }
      categories.push(await db.category.create({ data: category }));
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
          items.push(await db.item.create({ data: item }));
        }
      }
    }
  }

  return { categories, items };

}
