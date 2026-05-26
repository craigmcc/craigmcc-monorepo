# ShopShop Tech Stack

## Related Docs

- `apps/shopshop/REQUIREMENTS.md` — product behaviors and user-story scope.
- `apps/shopshop/ARCHITECTURE.md` — architectural boundaries and server design patterns.

## Runtime and framework

- Framework: Next.js (App Router)
- Language: TypeScript
- Package manager: pnpm (workspace)

## UI

- Shared UI/form packages from monorepo:
  - `@repo/daisy-ui`
  - `@repo/daisy-form`
- Notifications: `react-toastify`

## Data and persistence

- Database: PostgreSQL
- ORM: Prisma (`@repo/db-shopshop` package)
- Primary domain models: `Profile`, `List`, `Member`, `Category`, `Item`

## Authentication and session

- Authentication: Better Auth
- Session enrichment: `customSession` plugin includes `Profile`
- Client auth calls must go through Better Auth HTTP routes
- Session/profile cache exists server-side for session enrichment

## Testing and quality

- Test framework: Vitest
- Use CI-mode script for non-watch runs: `test:ci`
- Linting/formatting: ESLint + existing repo formatting conventions

## Architecture guidance

- Domain rules belong on the server side.
- Keep endpoint/service boundaries reusable by future native mobile clients.
- Keep authorization checks centralized around session + `MemberRole`.

## Deferred for v1

- Native mobile clients
- Real-time sync and offline support


