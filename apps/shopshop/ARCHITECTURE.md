# ShopShop Architecture

## Related Docs

- `apps/shopshop/REQUIREMENTS.md` — product behaviors and user-story intent.
- `apps/shopshop/TECH_STACK.md` — framework/dependency and tooling decisions.

This document defines implementation boundaries and technical decisions for `apps/shopshop`.
It complements `apps/shopshop/REQUIREMENTS.md` and `apps/shopshop/TECH_STACK.md`.

---

## 1) Goals

- Build a maintainable web-first application that can later support native mobile clients.
- Keep business rules centralized on the server.
- Keep authorization explicit and consistent across all write/read paths.
- Preserve clear shopping-state semantics (`selected`, `checked`) across UI and APIs.

---

## 2) Non-Goals (v1)

- Native iOS/Android app delivery.
- Real-time multi-device sync.
- Offline-first behavior.

---

## 3) System Context

### 3.1 Clients
- Web browser client (Next.js app).
- Future: native mobile clients using the same domain operations.

### 3.2 Core backend responsibilities
- Authentication/session management (Better Auth route handlers).
- Domain operations for lists/categories/items/members.
- Authorization checks based on authenticated `Profile` + `MemberRole`.
- Data persistence with Prisma + PostgreSQL.

---

## 4) Layered Architecture

### 4.1 Presentation Layer (UI)
- Location: `apps/shopshop/src/app/*`, `apps/shopshop/src/components/*`.
- Responsibilities:
  - Render views and collect user input.
  - Invoke application operations.
  - Show user-facing validation and errors.
- Must not contain authoritative authorization logic.

### 4.2 Application Layer (Use Cases)
- Suggested location: `apps/shopshop/src/server/application/*` (or equivalent).
- Responsibilities:
  - Orchestrate use cases (create list, select item, clear shopping state, etc.).
  - Load session/profile context from trusted server source.
  - Call domain policy checks before data mutations.
  - Return explicit result DTOs.

### 4.3 Domain/Policy Layer
- Suggested location: `apps/shopshop/src/server/domain/*`.
- Responsibilities:
  - Encode permission rules (`ADMIN` vs `GUEST`, membership checks).
  - Encode shopping-state rules and valid transitions.
  - Remain framework-agnostic and testable.

### 4.4 Data Access Layer
- Suggested location: `apps/shopshop/src/server/data/*`.
- Responsibilities:
  - Prisma queries/commands.
  - Transaction boundaries where needed.
  - No business-policy branching beyond persistence concerns.

---

## 5) Request Flow (Target Pattern)

1. Request enters route handler / server boundary.
2. Session is resolved from Better Auth.
3. Current `Profile` is resolved (via `customSession` enrichment).
4. Application use case validates membership/role against target `List`.
5. Domain policy validates requested state transition.
6. Data layer executes persistence changes.
7. Structured result returned to caller.

---

## 6) Authentication and Session

- Better Auth is the source of truth for authentication and session cookies.
- `customSession` enriches session with `Profile`.
- Keep auth flows routed through Better Auth HTTP handlers.
- Do not trust client-provided identity fields for authorization.

### 6.1 Future mobile readiness
- Current web flow is cookie-based.
- Domain operations and authorization checks must not assume a browser UI.
- Design operation inputs/outputs to be transport-friendly for future REST/tRPC endpoints.

---

## 7) Authorization Model

### 7.1 Identity
- Authenticated actor maps to one `Profile` (by unique email).

### 7.2 Membership and roles
- Access to a list requires membership (`Member`).
- Role privileges:
  - `ADMIN`: manage list metadata/members and all member capabilities.
  - `GUEST`: item/category participation and shopping actions.

### 7.3 Enforcement rule
- Every mutation endpoint/use case must validate:
  - authenticated profile exists,
  - actor is a member of the target list,
  - actor role is sufficient for the requested action.

---

## 8) Shopping-State Semantics

### 8.1 Field meanings
- `selected=true`: item appears in active shopping view.
- `checked=true`: selected item acquired; stays visible and shown crossed out.

### 8.2 View behavior
- Shopping view for a chosen list displays only `selected=true` items.
- Within that view, both checked and unchecked selected items are visible.

### 8.3 Clear action
- Available to both `ADMIN` and `GUEST` members.
- Non-destructive bulk update on a list:
  - set all items `selected=false`
  - set all items `checked=false`
- Does not delete any items.

### 8.4 Transition notes (to refine)
- [ ] Confirm whether setting `checked=true` should require `selected=true`.
- [ ] Confirm expected behavior when unselecting a checked item.

---

## 9) Data and Transaction Guidance

- Use Prisma through `@repo/db-shopshop`.
- Use transactions for multi-step operations that must be atomic.
- Favor idempotent operations when feasible.
- Keep bulk updates scoped by `listId` and authorized actor context.

---

## 10) API/Operation Design Guidelines

- Prefer explicit operation names and payloads (e.g., `selectItem`, `checkItem`, `clearShoppingState`).
- Return stable DTO shapes with actionable error codes/messages.
- Avoid leaking internal schema concerns directly to clients where unnecessary.
- Version externally consumed APIs if/when mobile clients are introduced.

---

## 11) Error Handling and Logging

- Log enough server context to diagnose failures (operation, actor/profile id, list id when available).
- Do not log secrets or credentials.
- Keep client-facing errors understandable and non-sensitive.

---

## 12) Testing Strategy

### 12.1 Unit tests
- Domain policy rules and state transitions.
- Authorization policy helpers.

### 12.2 Integration tests
- Application-layer use cases against test database fixtures/mocks.
- Verify authorization gates and mutation outcomes.

### 12.3 UI/component tests
- Critical user flows for sign-in/sign-up/sign-out and shopping interactions.

### 12.4 Command preference
- Use CI-mode tests (`test:ci`) for non-watch runs.

---

## 13) Folder Conventions (Proposed)

```text
apps/shopshop/src/
  app/                    # Next.js routes/layouts
  components/             # UI components
  contexts/               # Client state providers
  auth/                   # Better Auth client/server config
  server/
    application/          # Use-case orchestration
    domain/               # Rules and policies
    data/                 # Prisma-backed repositories/queries
    dto/                  # Request/response models
```

> This structure is a proposal; adapt as implementation evolves.

---

## 14) Decision Log

Use this section to capture architecture decisions as ADR-lite entries.

- **Date:** YYYY-MM-DD
  - **Decision:**
  - **Context:**
  - **Alternatives considered:**
  - **Consequences:**

---

## 15) Open Architecture Questions

- [ ] Should we standardize on route handlers, server actions, or a mixed model for app operations?
- [ ] What is the canonical error envelope for application operations?
- [ ] Which operations should be designed as batch endpoints from day one?
- [ ] What API versioning strategy should we use once native clients exist?


