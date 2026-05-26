# ShopShop Requirements

## Related Docs

- `apps/shopshop/TECH_STACK.md` — runtime, dependencies, and implementation constraints.
- `apps/shopshop/ARCHITECTURE.md` — server boundaries, authz policy, and operation design.

## Overview

ShopShop is a collaborative shopping-list web application inspired by (but simpler than)
the AnyList mobile app. It allows users to manage multiple named shopping lists, organize
items within those lists by category, share lists with other users, and check off items
while shopping.

---

## Data Model Summary

> Canonical source of truth is `packages/db-shopshop/prisma/schema.prisma`.
> This section is a plain-English summary for reference during feature design.

| Model        | Key Fields                                               | Notes                                              |
|--------------|----------------------------------------------------------|----------------------------------------------------|
| **Profile**  | email (unique), name, imageUrl                           | One per authenticated user; created on first login |
| **List**     | name, imageUrl, private                                  | A shopping list; `private` lists cannot be shared  |
| **Member**   | listId, profileId, role (ADMIN \| GUEST)                 | Join table — a Profile's membership in a List      |
| **Category** | name, listId                                             | Groups Items within a List; scoped to that List    |
| **Item**     | name, notes, quantity, checked, selected, categoryId, listId | `selected` = on active trip; `checked` = acquired  |

### Relationships

- A **Profile** belongs to many **Lists** via **Member**.
- A **List** has many **Members**, **Categories**, and **Items**.
- Every **Item** belongs to exactly one **Category** and one **List**.
- Deleting a **List** cascades to its **Members**, **Categories**, and **Items**.
- Deleting a **Category** cascades to its **Items**.

---

## Roles & Permissions

| Action                              | ADMIN | GUEST |
|-------------------------------------|:-----:|:-----:|
| View list and its items             |  ✓    |  ✓    |
| Add / edit / delete items           |  ✓    |  ✓    |
| Check / uncheck items               |  ✓    |  ✓    |
| Add / edit / delete categories      |  ✓    |  ✓    |
| Clear shopping state on a list (set all items `selected=false` and `checked=false`) |  ✓    |  ✓    |
| Rename the list                     |  ✓    |       |
| Invite another user to the list     |  ✓    |       |
| Remove a member from the list       |  ✓    |       |
| Change a member's role              |  ✓    |       |
| Delete the list entirely            |  ✓    |       |

> The Profile that creates a list is automatically its first ADMIN Member.

---

## User Stories

### Authentication
- As a new user, I can sign up with email + password so that I have an account.
- As a returning user, I can sign in with email + password.
- As a signed-in user, I can sign out.

### Lists
- As a signed-in user, I can see all lists I am a member of.
- As a signed-in user, I can create a new list (I become its ADMIN).
- As an ADMIN, I can rename a list.
- As an ADMIN, I can delete a list (all its categories and items are deleted too).
- As an ADMIN, I can mark a list as private (non-shareable).

### Sharing
- As an ADMIN of a non-private list, I can invite another user by email address.
- As an ADMIN, I can change an existing member's role (ADMIN ↔ GUEST).
- As an ADMIN, I can remove a member from the list.
- As a member, I can leave a list voluntarily.

### Categories
- As a member, I can see the categories defined for a list.
- As a member, I can add a new category to a list.
- As a member, I can rename a category.
- As a member, I can delete a category (all its items are deleted too).

### Items
- As a member, I can add an item to a list under a chosen category.
- As a member, I can edit an item's name, notes, or quantity.
- As a member, I can move an item to a different category within the same list.
- As a member, I can delete an item from a list.
- As a member, I can **select** an item (mark it as part of the current shopping trip).
- As a member, I can **check** an item (mark it as already acquired during a trip).
- As a member, checked items remain visible in the active shopping view and are shown crossed out.
- As a member, I can undo a check action (uncheck an item) if I made a mistake.
- As a member, I can uncheck all items on a list at once (start a new trip).
- As a member, I can deselect all items on a list at once (clear the active trip).

### Shopping Workflow
- As a member preparing for a store trip, I can choose a list and search existing items to quickly select what I need.
- As a member preparing for a store trip, I can add a brand-new item directly from the shopping workflow and select it immediately.
- As a member currently shopping, when I choose a list for shopping, the shopping view shows only items where `selected=true`.
- As a member currently shopping, in that selected-item view I can check items off as I put them in my cart.
- As a member currently shopping, checked items stay visible (crossed out) so I can confirm what I already grabbed.
- As a member currently shopping, selected items remain visible regardless of `checked` state (both checked and unchecked selected items are shown).
- As a member after returning home, I can use one clear action to uncheck and unselect everything on that list.
- As a member after returning home, the clear action is non-destructive: items remain in the database and only `selected` and `checked` are reset to `false`.

### Profile
- As a signed-in user, I can view my profile (name, email, avatar).
- As a signed-in user, I can update my display name.
- As a signed-in user, I can upload / change my avatar image.

---

## UI / UX Constraints

- **Web-only** — no native mobile app; the UI should be responsive and usable on
  a phone browser.
- **No real-time sync** — page / list data is fetched on load and on explicit user
  actions; no WebSocket or SSE requirement in v1.
- **No offline support** — network connectivity is assumed.
- **No item history / recurring items** — items are ephemeral within a list.
- **No store/aisle mapping** — categories are free-form text, not tied to store layouts.
- **No barcode scanning** — items are entered by name only.

### Future Mobile Readiness (Required for v1 server design)

- Server-side business logic should remain **client-agnostic** so the same flows can
  be used later by web and native mobile clients.
- Keep domain operations behind stable application boundaries (service/action/route
  layers) instead of coupling behavior directly to page components.
- Prefer request/response shapes that are explicit and transport-friendly (easy to
  expose through REST/tRPC later without redesigning core logic).
- Auth/session strategy in v1 may be cookie-first for web, but should avoid domain
  assumptions that prevent adding token-based mobile auth later.
- Authorization checks should be centralized around `Profile` + `MemberRole` rules,
  so policy logic is shared across future client types.

---

## Out of Scope (compared to AnyList)

- Native mobile apps (iOS / Android) in v1 UI delivery
- Real-time collaborative sync across multiple open browser tabs
- Recipe integration
- Automatic categorization / suggestions
- Store-specific aisle ordering
- Household / group management above the List level
- Offline mode / PWA

---

## Open Questions

- [ ] Should category order within a list be user-sortable (drag-and-drop), or always alphabetical?
- [ ] Should item order within a category be user-sortable, or always alphabetical?
- [ ] When inviting a user by email, what happens if no Profile exists for that email yet?
      (Options: reject with error; queue an invitation for when they sign up)
- [ ] Is there a maximum number of members per list?
- [ ] Should the `imageUrl` on List and Profile support file upload, or only an external URL?
- [ ] Should a GUEST be able to add/edit/delete categories, or only items?
      (Schema permits it; listed as allowed above — confirm before building the UI)



