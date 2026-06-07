/**
 * List Memberships page for the Lists belonging to the currently signed
 * in Profile.  The performed selection includes all Members (for Lists
 * this Profile is a part of), plus associated Lists, Categories and Items.
 */

// External Imports ----------------------------------------------------------

import { dbShopShop } from "@repo/db-shopshop";
import { redirect } from "next/navigation";

// Internal Imports ----------------------------------------------------------

import { MembersTable } from "@/components/members/MembersTable";
import { findProfile } from "@/lib/ProfileServerHelper";

// Public Objects ------------------------------------------------------------

export default async function MembersPage() {

  const profile = await findProfile();
  if (!profile) {
    redirect("/auth/signIn");
  }

  const members = await dbShopShop.member.findMany({
    include: {
      list: {
        include: {
          categories: {
            include: {
              items: true,
            }
          }
        },
      }
    },
    orderBy: [
      {list: {name: "asc"}},
    ],
    where: {
      profileId: profile.id,
    },
  });

  return (
    <MembersTable members={members} />
  )

}
