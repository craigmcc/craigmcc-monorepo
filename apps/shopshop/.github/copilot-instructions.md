# ShopShop Copilot Instructions

These instructions apply to work in `apps/shopshop/*` and supplement root instructions.

## Product and domain intent

- Build a collaborative shopping-list experience around `List`, `Category`, `Item`, `Member`, and `Profile`.
- Treat shopping flow semantics as first-class behavior:
  - `selected=true` means included in the active shopping view.
  - `checked=true` means acquired; item remains visible (crossed out) while selected.
  - Clear action resets both flags to `false` and does not delete items.

## Auth and authorization

- Better Auth handles authentication/session flows via HTTP routes.
- Server-side authorization must use trusted session/profile data, not client-only state.
- Authorization policy is role-based via `MemberRole` (`ADMIN`, `GUEST`).

## Server design for future mobile clients

- Keep business logic client-agnostic and reusable across web and future native clients.
- Prefer stable, explicit request/response shapes.
- Avoid coupling domain logic to page components.

## Testing

- Prefer `test:ci` scripts (not watch mode) for local verification in PRs.
- Add tests for state transitions involving `selected` and `checked`.

## Notes

- Product requirements are documented in `apps/shopshop/REQUIREMENTS.md`.
- Stack and workflow details are documented in `apps/shopshop/TECH_STACK.md` and `apps/shopshop/CONTRIBUTING.md`.

