/**
 * Utilities supporting functional tests of {Model}Action classes.
 */

// External Modules ----------------------------------------------------------

import {dbShopShop as db, Category, Item, List, MemberRole, Profile} from "@repo/db-shopshop";

// Internal Modules ----------------------------------------------------------

import { NotFoundError } from "@/lib/ErrorHelpers";
import { BaseUtils } from "@/test/BaseUtils";

// Public Objects -----------------------------------------------------------

export class ActionUtils extends BaseUtils {

  // Public Members --------------------------------------------------------

  /**
   * Look up and return the Category from the database with the specified id.
   *
   * @param categoryId                  ID of the requested Category
   *
   * @returns                           The requested Category
   *
   * @throws NotFoundError              If no such Category exists
   */
  public async lookupCategoryById(categoryId: string): Promise<Category> {
    const category = await db.category.findUnique({
      where: {
        id: categoryId,
      },
    });
    if (category) {
      return category;
    } else {
      throw new NotFoundError(`No Category found for ID '${categoryId}'`);
    }
  }

  /**
   * Look up and return the Category from the database that is associated
   * with the specified List, by name.
   *
   * @param list                        List for which the Category is requested
   * @param name                        Name of the Category that is requested
   *
   * @returns                           The requested Category
   *
   * @throws NotFoundError              If no such Category exists
   */
  public async lookupCategoryByName(list: List, name: string): Promise<Category> {
    const category = await db.category.findFirst({
      where: {
        listId: list.id,
        name,
      },
    });
    if (!category) {
      throw new NotFoundError(`No Category found for name '${name}' in list '${list.name}'`);
    }
    return category;
  }

  /**
   * Look up and return the Category from the database based on the requested role
   * that the Profile must have.
   *
   * @param profile                     Profile that is signed in
   * @param role                        Role that the Profile must have in the List (or null)
   *
   * @returns                           The requested Category
   *
   * @throws NotFoundError              If no such Category exists
   */
  public async lookupCategoryByRole(profile: Profile, role: MemberRole | null): Promise<Category> {
    if (role) {
      const category = await db.category.findFirst({
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
      if (category) {
        return category;
      } else {
        throw new NotFoundError(`No Category found for Profile '${profile.email}' with role '${role}'`);
      }
    } else {
      const category = await db.category.findFirst({
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
      if (category) {
        return category;
      } else {
        throw new NotFoundError(`No Category found for Profile '${profile.email}' with no role`);
      }
    }
  }

  /**
   * Look up and return the Item from the database with the specified id.
   *
   * @param itemId                      ID of the requested Item
   *
   * @returns                           The requested Item
   *
   * @throws NotFoundError              If no such Item exists
   */
  public async lookupItemById(itemId: string): Promise<Item> {
    const item = await db.item.findUnique({
      where: {
        id: itemId,
      },
    });
    if (item) {
      return item;
    } else {
      throw new NotFoundError(`No Item found for ID '${itemId}'`);
    }
  }

  /**
   * Look up and return the Item from the database that is associated
   * with the specified Category, by name.
   *
   * @param category                    Category for which the Item is requested
   * @param name                        Name of the Item that is requested
   *
   * @returns                           The requested Item
   *
   * @throws NotFoundError              If no such Item exists
   */
  public async lookupItemByName(category: Category, name: string): Promise<Item> {
    const item = await db.item.findFirst({
      where: {
        categoryId: category.id,
        name,
      },
    });
    if (!item) {
      throw new NotFoundError(`No Item found for name '${name}' in Category '${category.name}'`);
    }
    return item;
  }

  /**
   * Look up and return the Item from the database by the role the Profile must have.
   *
   * @param profile                     Profile that is signed in
   * @param role                        Role that the Profile must have in the List (or null)
   *
   * @returns                           The requested Item
   *
   * @throws NotFoundError              If no such Item exists
   */
  public async lookupItemByRole(profile: Profile, role: MemberRole | null): Promise<Item> {
    if (role) {
      const item = await db.item.findFirst({
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
      if (item) {
        return item;
      } else {
        throw new NotFoundError(`No Item found for Profile '${profile.email}' with role '${role}'`);
      }
    } else {
      const item = await db.item.findFirst({
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
      if (item) {
        return item;
      } else {
        throw new NotFoundError(`No Item found for Profile '${profile.email}' with no role`);
      }
    }
  }

  /**
   * Look up and return the Items for the specified Category.
   *
   * @param category                   Category for which the Items are requested
   *
   * @returns                          The requested Items
   */
  public async lookupItems(category: Category): Promise<Item[]> {
    return db.item.findMany({
      orderBy: {
        name: "asc",
      },
      where: {
        categoryId: category.id,
      },
    });
  }

  /**
   * Look up and return the List from the database.
   *
   * @param listId                      ID of the requested List
   *
   * @returns                           The requested List
   *
   * @throws NotFoundError              If no such List exists
   */
  public async lookupListById(listId: string): Promise<List> {
    const list = await db.list.findFirst({
      where: {
        id: listId,
      },
    });
    if (!list) {
      throw new NotFoundError(`No List found for ID '${listId}'`);
    }
    return list;
  }

  /**
   * Look up and return the List from the database.
   *
   * @param name                        Name of the requested List
   *
   * @returns                           The requested List
   *
   * @throws NotFoundError              If no such List exists
   */
  // TODO: Deprecate and remove usages
  public async lookupListByName(name: string): Promise<List> {
    const list = await db.list.findFirst({
      where: {
        name,
      },
    });
    if (!list) {
      throw new NotFoundError(`No List found for name '${name}'`);
    }
    return list;
  }

  /**
   * Look up and return the first List for which the specified Profile is a Member
   * with the specified Role (or not a Member if role is null).
   *
   * @param profile                     Profile that is signed in
   * @param role                        Role that the Profile must have in the List (or null)
   *
   * @returns                           The requested List
   *
   * @throws NotFoundError              If no such List exists
   */
  public async lookupListByRole(profile: Profile, role: MemberRole | null): Promise<List> {
    if (role) {
      const list = await db.list.findFirst({
        where: {
          members: {
            some: {
              profileId: profile.id,
              role,
            },
          },
        },
      });
      if (list) {
        return list;
      } else {
        throw new NotFoundError(`No List found for Profile '${profile.email}' with role '${role}'`);
      }
    } else {
      const list = await db.list.findFirst({
        where: {
          members: {
            none: {
              profileId: profile.id,
            },
          },
        },
      });
      if (list) {
        return list;
      } else {
        throw new NotFoundError(`No List found for Profile '${profile.email}' with no role`);
      }
    }
  }

  /**
   * Look up and return the Profile from the database by email address.
   *
   * @param email                       Email address of the requested Profile
   *
   * @returns                           The requested Profile
   *
   * @throws NotFoundError              If no such Profile exists
   */
  public async lookupProfileByEmail(email: string): Promise<Profile> {
    const profile = await db.profile.findUnique({
      where: {
        email,
      },
    });
    if (profile) {
      return profile;
    } else {
      throw new NotFoundError(`No Profile found for email '${email}'`);
    }
  }

  /**
   * Pause execution for the specified number of milliseconds.
   *
   * @param ms                          The number of milliseconds to pause
   */
  public async pause(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

}
