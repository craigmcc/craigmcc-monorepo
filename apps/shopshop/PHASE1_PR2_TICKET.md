# Phase 1 PR-2: Idempotency persistence model and repository

## Objective

Add persistent server-side idempotency tracking so write operations can be replay-safe. This PR introduces the storage model and repository helpers only; endpoint behavior changes come in PR-3/PR-4.

## Scope

- Add Prisma model/table for idempotency records.
- Add migration files and regenerate Prisma client.
- Add repository helper module for create/lookup/complete operations.
- Add unit/integration tests for repository behavior.
- **No route/action conversion yet** (that starts in PR-3/PR-4).

## Acceptance Criteria

- [ ] Prisma schema includes an idempotency model keyed by `(actorProfileId, operationId)`.
- [ ] Migration applies cleanly on local and test databases.
- [ ] Repository supports lookup/create/complete paths.
- [ ] Duplicate key behavior is deterministic and test-covered.
- [ ] Repository tests cover payload-hash mismatch detection input path.
- [ ] No breaking changes to existing route contracts.
- [ ] CI passes: `pnpm --filter shopshop test:ci && lint && check-types`.

## Suggested Files

Primary locations:
- `packages/db-shopshop/prisma/schema.prisma` - add idempotency model.
- `packages/db-shopshop/prisma/migrations/*` - migration SQL.
- `apps/shopshop/src/lib/OperationRecordRepository.ts` - data helpers.
- `apps/shopshop/src/lib/OperationRecordRepository.test.ts` - repository tests.

Likely touchpoints:
- `packages/db-shopshop/src/types.ts` (if new model types should be exported for app usage).
- `apps/shopshop/src/test/BaseUtils.ts` (if shared test setup helpers are useful).

## Deliverables

### 1. Prisma persistence model

```prisma
// packages/db-shopshop/prisma/schema.prisma

model OperationRecord {
  id String @id @default(uuid())

  actorProfileId String   @map("actor_profile_id")
  actorProfile   Profile  @relation(fields: [actorProfileId], references: [id], onDelete: Cascade)
  operationId    String   @map("operation_id")
  operationType  String   @map("operation_type")
  payloadHash    String   @map("payload_hash")

  status         String   @default("PENDING")
  responseStatus Int?     @map("response_status")
  responseBody   Json?    @map("response_body")
  conflictCode   String?  @map("conflict_code")

  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  completedAt    DateTime? @map("completed_at")

  @@unique([actorProfileId, operationId])
  @@index([createdAt])
  @@index([actorProfileId])
  @@map("operation_records")
}
```

Notes:
- `status` can start as string-backed values (`PENDING`, `COMPLETED`, `REJECTED`) to keep migration simple.
- `responseBody` stores the replay snapshot returned for duplicates.
- `payloadHash` supports same-key/different-payload rejection in PR-3.
- `actorProfile` relation keeps idempotency records tied to valid profiles.

### 2. Repository helper API

```typescript
// apps/shopshop/src/lib/OperationRecordRepository.ts

export type OperationRecordCreateInput = {
  actorProfileId: string;
  operationId: string;
  operationType: string;
  payloadHash: string;
};

export async function lookupOperationRecord(actorProfileId: string, operationId: string) {
  // returns existing record or null
}

export async function createOperationRecord(input: OperationRecordCreateInput) {
  // first-seen create; duplicate key handled by caller logic
}

export async function completeOperationRecord(input: {
  actorProfileId: string;
  operationId: string;
  responseBody: unknown;
  responseStatus: number;
  status: "COMPLETED" | "REJECTED";
  conflictCode?: string;
}) {
  // updates replay snapshot + completion metadata
}
```

Implementation guidance:
- Keep repository focused on data access (no auth checks here).
- Let the wrapper in PR-3 decide retry/replay policy.
- Return strongly typed objects where practical.

### 3. Duplicate-key detection helper

```typescript
// optional in OperationRecordRepository.ts or colocated helper

export function isUniqueConstraintError(error: unknown): boolean {
  // Detect Prisma unique violation (P2002) for (actorProfileId, operationId)
}
```

Why this now:
- PR-3 needs deterministic branch handling when two requests race to create the same key.

## Test Cases

Create tests in `apps/shopshop/src/lib/OperationRecordRepository.test.ts` covering:

### Record creation
- [ ] create first-seen record with `PENDING` status.
- [ ] created record includes expected `actorProfileId`, `operationId`, `operationType`, `payloadHash`.

### Lookup behavior
- [ ] `lookupOperationRecord()` returns `null` when no record exists.
- [ ] `lookupOperationRecord()` returns the record after create.

### Duplicate key behavior
- [ ] second create with same `(actorProfileId, operationId)` fails with unique constraint.
- [ ] helper `isUniqueConstraintError()` returns true for duplicate-key error.

### Completion behavior
- [ ] `completeOperationRecord()` stores `responseStatus` and `responseBody`.
- [ ] completion sets `completedAt` and moves status from `PENDING` to terminal value.

### Payload mismatch preparation
- [ ] create with same key and different `payloadHash` is detectable via lookup result and test assertion.

## Task Checklist

- [ ] Add `OperationRecord` model to Prisma schema.
- [ ] Generate migration and review SQL before commit.
- [ ] Run Prisma generate for updated client artifacts.
- [ ] Implement repository helpers (`lookup`, `create`, `complete`).
- [ ] Add repository tests for all scenarios listed above.
- [ ] Verify no linting errors: `pnpm --filter shopshop lint`.
- [ ] Verify no type errors: `pnpm --filter shopshop check-types`.
- [ ] Verify tests pass: `pnpm --filter shopshop test:ci`.
- [ ] Commit with clear message following CONTRIBUTING.md style.
- [ ] Create PR and fill GitHub PR checklist.

## Definition of Done

PR can be merged when:

- [ ] All tasks above are complete.
- [ ] CI checks pass (test:ci, lint, check-types).
- [ ] Migration is applied successfully against local/test DB.
- [ ] Repository behavior for duplicate keys is test-covered.
- [ ] No route/action behavior changes included (kept for later PRs).
- [ ] Ready to merge (solo self-review complete).

## Notes

- This PR should not introduce new API request/response shapes.
- Keep endpoint behavior unchanged while persistence foundation lands.
- Prefer small, explicit repository methods over one large abstraction.
- Keep field names stable; later PRs depend on these contracts.

## Local Verification Commands

**Note:** Both the local and test databases need to have the migration run. Use `pnpm db-shopshop:migrate` for the local database and `pnpm db-shopshop:migrate:test` for the test database (both scripts are defined in the db-shopshop package.json file).

```bash
cd "/Users/craigmcc/Git.Craigmcc/craigmcc-monorepo/packages/db-shopshop"
pnpm db-shopshop:migrate --name add_operation_records
pnpm db-shopshop:migrate:test --name add_operation_records
pnpm db-shopshop:generate
```

```bash
cd "/Users/craigmcc/Git.Craigmcc/craigmcc-monorepo"
pnpm --filter shopshop test:ci
pnpm --filter shopshop lint
pnpm --filter shopshop check-types
```

## Branch and Commit Guidance

**Branch:** `phase1-pr2-idempotency-persistence`

**Commit message:**

```text
Add idempotency persistence model and repository helpers

- Add OperationRecord Prisma model with unique (actorProfileId, operationId)
- Add migration and regenerate Prisma client
- Implement lookup/create/complete repository helpers
- Add repository tests for create/find/duplicate/completion behavior

No endpoint behavior changes yet.
Fixes: Phase 1 PR-2 (ARCHITECTURE.md)
```

---

## Success Metrics

Once merged, you should be able to:
- Persist first-seen operation records reliably.
- Detect duplicate operation keys deterministically.
- Store replay snapshots for completed operations.
- Reuse repository APIs directly in PR-3 idempotent execution wrapper.



