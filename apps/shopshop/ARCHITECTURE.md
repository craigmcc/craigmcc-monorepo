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

- **Date:** 2026-06-08
  - **Decision:** Prefer a transport-agnostic domain model with a phased sync strategy: (1) offline write queue + optimistic UI, (2) server-driven fan-out for shared-list updates, (3) mobile clients consume HTTP/WebSocket APIs rather than React Server Functions.
  - **Context:** Product direction includes offline capture/replay, collaborative list updates, and eventual mobile apps. Current web implementation is server-first with Next.js pages plus action/route boundaries.
  - **Alternatives considered:**
    - Keep browser-only server action calls as the long-term write path.
    - Defer offline and realtime entirely until native app work starts.
    - Adopt a full local-first platform immediately across the whole app.
  - **Consequences:**
    - New writes should be modeled as durable operations/events with idempotency keys.
    - Authorization/policy logic must remain server-side and reusable from multiple transports.
    - Mobile support remains practical because core operations are exposed over standard APIs.

---

## 15) Future Sync and Mobile Strategy (Planning)

This section captures the current direction for long-term capabilities. It is a plan,
not a commitment to immediate implementation.

### 15.1 Offline optimistic capture and replay

Target behavior:
- User actions apply immediately in UI (optimistic).
- Actions are durably queued when offline.
- Queue replays in order when connectivity resumes.
- Conflicts resolve predictably (server authoritative, client reconciles).

Suggested baseline design:
1. Define operation envelope used by all writes:
   - `operationId` (UUID idempotency key)
   - `actorProfileId`
   - `listId`
   - `operationType`
   - `payload`
   - `clientTimestamp`
2. Persist queued operations locally (web: IndexedDB; mobile: device local DB).
3. Apply optimistic projection locally per operation.
4. Replay operations to server endpoint in FIFO order.
5. Server enforces authorization and domain rules; returns accepted/rejected result.
6. Client reconciles local projection to server-confirmed state.

Conflict guidance:
- Use idempotency keys so retries are safe.
- Prefer operation semantics over raw document replacement.
- Keep server as source of truth for shared data integrity.

### 15.2 Realtime propagation while online

Target behavior:
- Changes to a shared list are pushed to all connected members quickly.

Practical options:
- **Option A (incremental):** DB write -> server publish -> WebSocket/SSE fan-out per `listId` channel.
- **Option B (local-first stack):** Evaluate TanStack DB + ElectricSQL style replication/sync if product priorities justify the added complexity.

Recommendation for sequencing:
- Start with Option A to validate collaboration UX and authorization boundaries.
- Re-evaluate Option B once offline + multi-client conflict needs are clearer.

### 15.3 Mobile compatibility and React Server Functions

Short answer: mobile clients should not depend on React Server Functions.

Guidance:
- React Server Functions are excellent for Next.js web ergonomics.
- They are not a universal client transport contract for native mobile.
- Keep core operations callable through transport-neutral boundaries (HTTP and realtime channels).

Implication for architecture:
- Treat server functions as a web adapter.
- Keep domain/application logic behind shared server modules used by:
  - Next.js server functions/routes (web)
  - REST/tRPC/GraphQL endpoints (mobile and external clients)
  - Realtime message handlers (collaboration)

### 15.4 Suggested phased roadmap

- **Phase 0 (now):** Keep current server-first flow; continue route/action hardening.
- **Phase 1:** Introduce operation envelope + idempotency keys on write endpoints.
- **Phase 2:** Add client-side queue + optimistic projection for selected write paths.
- **Phase 3:** Add realtime fan-out for shared list channels.
- **Phase 4:** Expose stable mobile-oriented API surface using the same server use cases.
- **Phase 5:** Reassess full local-first sync stack (e.g., ElectricSQL-style) with measured data.

### 15.5 Phase 1 technical checklist (operation envelope + idempotency)

Use this checklist before implementing broad offline/realtime behavior.

- [ ] **Define canonical operation envelope** with required fields:
  - `operationId` (UUID)
  - `operationType`
  - `listId`
  - `actorProfileId` (resolved server-side when possible)
  - `payload`
  - `clientTimestamp`
  - `schemaVersion`
- [ ] **Standardize write response envelope** for operation-aware writes:
  - `operationId`
  - `accepted` / `rejected`
  - `status` (HTTP + app result)
  - `serverTimestamp`
  - optional `conflictCode` / `validationIssues`
- [ ] **Add idempotency persistence** on the server:
  - storage keyed by `(actorProfileId, operationId)`
  - response snapshot for duplicate replay
  - retention policy (TTL/cleanup)
- [ ] **Implement server replay behavior**:
  - first-seen operation executes normally
  - duplicate operation returns stored prior result without side effects
  - mismatched payload for same idempotency key is rejected and logged
- [ ] **Enforce authorization before mutation effects** for all operation-aware endpoints.
- [ ] **Add operation validation** with explicit schema per `operationType`.
- [ ] **Instrument observability**:
  - log `operationId`, `operationType`, `actorProfileId`, `listId`
  - emit counters for accepted, duplicate, rejected, auth-failed
  - track replay latency and error rates
- [ ] **Add migration-safe storage changes**:
  - table/index for idempotency records
  - safe backfill/default handling if needed
- [ ] **Define deterministic error taxonomy** for retry policy:
  - retryable (transient/server/network)
  - terminal (validation/auth/conflict)
- [ ] **Add test coverage (CI mode)**:
  - same `operationId` submitted twice returns same result and no double-write
  - same `operationId` with different payload is rejected
  - unauthorized operations are rejected and not recorded as successful
  - concurrent duplicate submissions still produce exactly-once effects
- [ ] **Rollout plan**:
  - enable on a small set of high-value write operations first
  - monitor metrics/logs
  - expand operation-by-operation

### 15.6 Phase 1 starter PR plan (incremental)

Implement Phase 1 in small PRs so each change is reviewable and reversible.

#### PR-1: Shared operation envelope types and validation

Scope:
- Add shared TypeScript types and Zod schemas for operation-aware writes.
- Keep old write payloads valid during transition.

Suggested files:
- `apps/shopshop/src/types/*` (or `src/server/dto/*` if introduced)
- `packages/db-shopshop/zod-schemas/*` (if shared schema location is preferred)

Deliverables:
- `OperationEnvelope` type and `OperationType` enum/union.
- Validation schema for envelope + per-operation payload schema mapping.
- `schemaVersion` constant and parser helper.

Acceptance checks:
- Unit tests for valid/invalid envelope parsing.
- No behavior change to existing endpoints yet.

#### PR-2: Idempotency persistence model + repository

Scope:
- Add server persistence for idempotency tracking and response replay.

Suggested files:
- `packages/db-shopshop/prisma/schema.prisma`
- `apps/shopshop/src/server/data/*` (or `src/lib/*` until server folders are created)
- Prisma migration files in `packages/db-shopshop/prisma/migrations/*`

Deliverables:
- New idempotency record model/table keyed by `(actorProfileId, operationId)`.
- Read/write repository helpers:
  - `lookupOperationRecord(...)`
  - `createOperationRecord(...)`
  - `completeOperationRecord(...)`

Acceptance checks:
- Migration applies cleanly.
- Repository tests cover create/find/duplicate-key behavior.

#### PR-3: Operation execution wrapper (exactly-once guard)

Scope:
- Introduce a reusable server wrapper that enforces idempotency and replay behavior.

Suggested files:
- `apps/shopshop/src/server/application/*` (or `src/actions/*` helper module)

Deliverables:
- Wrapper signature similar to:
  - `executeIdempotentOperation({ actorProfileId, operationId, operationType, payload }, handler)`
- Behavior:
  - return stored result on duplicate
  - reject same key + different payload hash
  - run handler once for first-seen operation

Acceptance checks:
- Unit tests for first-run, duplicate replay, and payload-mismatch rejection.

#### PR-4: First endpoint conversion (pilot = list create)

Scope:
- Convert one high-value endpoint first to de-risk pattern.

Suggested initial target:
- `POST /api/list` (`apps/shopshop/src/app/api/(actions)/list/route.ts`)
- Underlying action path in `apps/shopshop/src/actions/ListActions.ts`

Deliverables:
- Endpoint accepts operation envelope.
- Action execution routed through idempotency wrapper.
- Response includes `operationId`, `accepted|rejected`, `serverTimestamp`.

Acceptance checks:
- Existing route tests updated.
- New tests:
  - same `operationId` twice => single persisted list, same response
  - same key + different payload => rejection

#### PR-5: Extend to remaining write endpoints

Scope:
- Apply proven pattern across remaining mutation routes.

Targets:
- `POST /api/category`
- `POST /api/item`
- `PUT /api/list/:listId`
- `DELETE /api/list/:listId`
- `PUT /api/category/:categoryId`
- `DELETE /api/category/:categoryId`
- `PUT /api/item/:itemId`
- `DELETE /api/item/:itemId`
- `PUT /api/profile`

Deliverables:
- Consistent operation envelope handling and replay semantics across all writes.

Acceptance checks:
- Endpoint test suites include idempotency scenarios for each converted route.

#### PR-6: Observability + retention

Scope:
- Add operational visibility and cleanup for idempotency records.

Suggested files:
- `apps/shopshop/src/lib/*` or `src/server/*` logging/metrics modules
- maintenance script under `scripts/*` (or scheduled job entry)

Deliverables:
- Structured logs include `operationId`, `operationType`, `actorProfileId`, `listId`, outcome.
- Metrics counters for accepted/duplicate/rejected/auth-failed.
- Retention job (TTL cleanup) for stale idempotency records.

Acceptance checks:
- Logging assertions in targeted tests where practical.
- Documented retention policy and operational runbook note.

#### Rollout notes

- Convert client callers in a separate PR stream after server compatibility lands.
- Maintain backward-compatible payload handling until all web flows are migrated.
- Treat mobile clients as first-class consumers of the operation envelope once stable.

---
