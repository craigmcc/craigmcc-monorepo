/**
 * Base utilities for functional tests.
 */

// External Modules ----------------------------------------------------------

import { dbShopShop as db, Category, Item, List, Member, MemberRole, Profile } from "@repo/db-shopshop";

// Internal Modules ----------------------------------------------------------

import { populateList } from "@/lib/ListHelpers";
import * as SeedData from "@/test/SeedData";

// Public Objects ------------------------------------------------------------

// Options to choose which models should be populated
export type OPTIONS = {
  withCategories: boolean,
  withItems: boolean,
  withLists: boolean,
  withMembers: boolean,
  withProfiles: boolean,
}

/**
 * Base utilities for functional tests.
 */
export class BaseUtils {

  /**
   * Erase current database, then load seed data for the models selected
   * in the options parameter.
   *
   * @param options                     Flags to select tables to be loaded
   */
  public async loadData(options: Partial<OPTIONS>) {

    // Delete all existing rows in all tables
    await db.category.deleteMany();
    await db.item.deleteMany();
    await db.list.deleteMany();
    await db.member.deleteMany();
    await db.profile.deleteMany();
    await db.user.deleteMany();

    // Load Profiles if requested
    const profiles: Profile[] = [];
    if (options.withProfiles) {
      for (const profile of SeedData.PROFILES) {
        // Generate the Profile model
        profiles.push(await db.profile.create({
          data: {
            email: profile.email!,
            name: profile.name!,
          }
        }));
        // Generate the corresponding better-auth User model
        await db.user.create({
          data: {
            email: profile.email!,
            name: profile.name!,
          }
        });
      }
    }

    // Load Lists if requested
    const lists: List[] = [];
    let categories: Category[] = [];
    let items: Item[] = [];
    if (options.withLists) {
      for (const list of SeedData.LISTS) {
        const created: List = await db.list.create({
          data: {
            name: list.name!,
          }
        });
        lists.push(created);
        // Also create the related Categories and Items, if requested
        if (options.withCategories || options.withItems) {
          ({ categories, items } = await populateList(created.id, options.withCategories!, options.withItems!));
        }
      }
    }

    // Load Members if requested
    const members: Member[] = [];
    if (options.withProfiles && options.withLists && options.withMembers) {
      members.push(
        await db.member.create({
          data: {
            listId: lists[0]!.id,
            profileId: profiles[0]!.id,
            role: MemberRole.ADMIN,
          }
        })
      );
      members.push(
        await db.member.create({
          data: {
            listId: lists[1]!.id,
            profileId: profiles[0]!.id,
            role: MemberRole.GUEST,
          }
        })
      );
      members.push(
        await db.member.create({
          data: {
            listId: lists[1]!.id,
            profileId: profiles[1]!.id,
            role: MemberRole.ADMIN,
          }
        })
      );
      members.push(
        await db.member.create({
          data: {
            listId: lists[2]!.id,
            profileId: profiles[1]!.id,
            role: MemberRole.GUEST,
          }
        })
      );
      members.push(
        await db.member.create({
          data: {
            listId: lists[2]!.id,
            profileId: profiles[2]!.id,
            role: MemberRole.ADMIN,
          }
        })
      );
      members.push(
        await db.member.create({
          data: {
            listId: lists[1]!.id,
            profileId: profiles[2]!.id,
            role: MemberRole.GUEST,
          }
        })
      );

    }

    return { categories, items, lists, members, profiles };

  }

}
