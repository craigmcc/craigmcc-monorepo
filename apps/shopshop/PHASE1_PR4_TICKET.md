# Phase 1 PR-4: First endpoint conversion (pilot = list create)

## Objective

Convert the first write endpoint to the operation-envelope contract so the idempotent execution pattern from PR-3 is exercised at the route boundary.

This PR pilots the full endpoint flow for `POST /api/list`:
- endpoint accepts an operation envelope
- route validates and forwards the envelope
- action executes through the idempotency wrapper
- response includes deterministic idempotency metadata

## Scope

- Convert `POST /api/list` to accept an operation envelope instead of a raw list-create payload.
- Route the underlying `createList()` execution through the PR-3 idempotency path.
- Return route responses that include `operationId`, `accepted|rejected`, and `serverTimestamp`.
- Update route tests for first-seen execution, replay, and payload mismatch behavior.
- Keep scope limited to the pilot endpoint only.
- Do not convert any other routes in this PR.

## Why This PR Exists

PR-1 introduced the shared operation envelope.
PR-2 introduced persistence for idempotency records.
PR-3 integrated the execution wrapper into actions.

PR-4 is the first route-level conversion that proves the end-to-end API contract before PR-5 expands the same pattern to the remaining write endpoints.

## Primary Target

- `POST /api/list`
- Route file: `apps/shopshop/src/app/api/(actions)/list/route.ts`
- Underlying action: `apps/shopshop/src/actions/ListActions.ts`

## Acceptance Criteria

- [ ] `POST /api/list` accepts a valid operation envelope for `createList`.
- [ ] First-seen request creates exactly one list and returns success metadata including `operationId` and `serverTimestamp`.
- [ ] Duplicate same-key + same-payload request returns deterministic replay response without creating a second list.
- [ ] Duplicate same-key + different-payload request returns deterministic rejection.
- [ ] Existing create-list route tests are updated to the new request/response contract.
- [ ] CI passes: `pnpm --filter shopshop test:ci && pnpm --filter shopshop lint && pnpm --filter shopshop check-types`.

## Suggested Files

Primary implementation:
- `apps/shopshop/src/app/api/(actions)/list/route.ts`
- `apps/shopshop/src/app/api/(actions)/list/route.test.ts`

Likely touchpoints:
- `apps/shopshop/src/actions/ListActions.ts`
- `apps/shopshop/src/lib/OperationEnvelopeHelpers.ts`
- `apps/shopshop/src/zod-schemas/OperationEnvelopeSchema.ts`
- `apps/shopshop/src/types/OperationEnvelope.ts`

Prior dependencies to reuse:
- `apps/shopshop/src/lib/ExecuteIdempotentOperation.ts`
- `apps/shopshop/src/lib/OperationIdempotencyHelpers.ts`
- `apps/shopshop/src/lib/OperationRecordRepository.ts`

## Deliverables

### 1. Route request contract

The route should accept an operation envelope whose:
- `operationType` is `createList`
- `payload` matches the list-create payload contract
- `schemaVersion` matches the current envelope schema version

The route should reject malformed or mismatched envelopes with a deterministic client error.

### 2. Route response contract

Success and replay responses should include:
- `operationId`
- outcome flag such as `accepted` / `rejected` or equivalent deterministic shape
- `serverTimestamp`
- list data payload when successful

Mismatch/rejection responses should include:
- `operationId`
- deterministic rejection indicator
- stable error/status mapping

### 3. Pilot test coverage

Add or update route tests for:
- valid first-seen `createList` envelope
- valid duplicate replay with same `operationId` and same payload
- conflict/rejection for same `operationId` with different payload
- invalid or mismatched envelope shape/type

## Test Cases

### First-seen execution
- [ ] A valid `createList` envelope returns success.
- [ ] Exactly one list is persisted.
- [ ] Response includes `operationId` and `serverTimestamp`.

### Replay
- [ ] Same envelope sent twice returns deterministic response.
- [ ] No second list is created.
- [ ] Replay response shape matches the first response contract.

### Payload mismatch
- [ ] Same `operationId` with different payload is rejected.
- [ ] Response includes stable error/status semantics.

### Envelope validation
- [ ] Non-envelope requests fail cleanly.
- [ ] Wrong `operationType` for the route fails cleanly.
- [ ] Invalid `schemaVersion` or malformed fields fail cleanly.

## Implementation Notes

- Keep the route-level conversion narrow: only `POST /api/list` in this PR.
- Prefer validating the envelope at the route boundary, not inside unrelated lower-level code.
- Reuse PR-3 action support rather than re-implementing idempotency in the route.
- Keep user-facing response shape deterministic across first-run and replay paths.
- Preserve existing auth behavior for unsigned callers.

## PR-4 Kickoff Checklist and Suggested Commits

### Kickoff Checklist

1. Branch setup
   - `git checkout main`
   - `git pull`
   - `git checkout -b phase1-pr4-list-endpoint-envelope`

2. Baseline verification
   - Confirm ticket content in `apps/shopshop/PHASE1_PR4_TICKET.md`.
   - Review the merged PR-3 idempotent action behavior for `createList()`.
   - Run:
	 ```bash
	 cd "/Users/craigmcc/Git.Craigmcc/craigmcc-monorepo"
	 pnpm --filter shopshop check-types
	 pnpm --filter shopshop lint
	 pnpm --filter shopshop test:ci
	 ```

3. Milestone 1: Route request contract
   - Update `apps/shopshop/src/app/api/(actions)/list/route.ts` so `POST /api/list` accepts an operation envelope.
   - Validate `operationType`, `schemaVersion`, and payload shape at the route boundary.
   - Keep rejection behavior deterministic for malformed or mismatched envelopes.

4. Milestone 2: Action forwarding and response metadata
   - Forward the parsed envelope through the existing `createList()` idempotency path.
   - Ensure first-seen and replay responses expose `operationId`, outcome metadata, and `serverTimestamp`.
   - Preserve existing auth and list-create behavior outside the envelope contract shift.

5. Milestone 3: Route test coverage
   - Update `apps/shopshop/src/app/api/(actions)/list/route.test.ts` for the envelope request shape.
   - Add or adjust tests for first-seen success, replay, payload mismatch, and invalid envelope cases.
   - Assert that duplicate same-payload requests do not create a second list.

6. Final PR prep
   - Re-run validation commands.
   - Update ticket checkboxes.
   - Keep commits focused on the pilot endpoint only.
   - Push branch and open draft PR.

### Suggested Commit Messages

1. `Convert list route to operation envelope request contract`
   - Update `POST /api/list` to parse and validate the operation envelope.
   - Enforce route-level checks for `operationType`, `schemaVersion`, and payload shape.
   - Keep malformed-envelope failures deterministic.

2. `Return idempotency metadata from list route responses`
   - Forward the parsed envelope through the existing `createList()` idempotent execution path.
   - Include `operationId`, stable outcome metadata, and `serverTimestamp` in route responses.
   - Preserve create-list behavior for successful first-seen execution and replay.

3. `Update list route tests for envelope replay and mismatch flows`
   - Convert route tests to the new envelope request/response contract.
   - Add assertions for first-seen success, replay without duplicate writes, and payload mismatch rejection.
   - Cover invalid or mismatched envelope validation branches.

## Pull Request Description Template

```markdown
## Summary

Implements Phase 1 PR-4 by converting the pilot write endpoint, `POST /api/list`, to the operation-envelope contract.

This PR adds:
- route-level operation envelope validation for list creation
- forwarding into the PR-3 idempotent execution path
- deterministic response metadata including `operationId` and `serverTimestamp`
- route-level replay, mismatch, and malformed-envelope coverage

## Scope

Pilot endpoint conversion only:

1. `apps/shopshop/src/app/api/(actions)/list/route.ts`
2. `apps/shopshop/src/app/api/(actions)/list/route.test.ts`

Related reused dependencies:
- `apps/shopshop/src/actions/ListActions.ts`
- `apps/shopshop/src/lib/ExecuteIdempotentOperation.ts`
- `apps/shopshop/src/lib/OperationEnvelopeHelpers.ts`
- `apps/shopshop/src/lib/OperationIdempotencyHelpers.ts`

## Behavior Changes

- **Valid first-seen envelope**
  - `POST /api/list` accepts an operation envelope for `createList`
  - Executes through the existing idempotent action path
  - Returns success payload plus deterministic metadata

- **Duplicate request with same payload**
  - Does not create a second list
  - Replays deterministic response metadata and payload shape

- **Duplicate request with different payload**
  - Returns deterministic rejection/conflict behavior
  - Includes stable error semantics and operation metadata

- **Malformed or mismatched envelope**
  - Fails cleanly at the route boundary
  - Does not reach unrelated mutation logic

## What Did Not Change

- No additional endpoint conversions in this PR
- No re-implementation of idempotency logic in the route
- No unrelated contract changes outside the pilot endpoint

## Testing

### Added/Updated
- Route-level tests for:
  - valid first-seen create-list envelope
  - replay with same `operationId` and same payload
  - rejection for same `operationId` with different payload
  - invalid or mismatched envelope validation failures

### Verification Commands

```bash
cd "/Users/craigmcc/Git.Craigmcc/craigmcc-monorepo"
pnpm --filter shopshop test:ci
pnpm --filter shopshop lint
pnpm --filter shopshop check-types
```

## Risk / Rollout Notes

- Main risk is route/action contract drift during the first endpoint conversion.
- Mitigation: keep scope limited to `POST /api/list`, reuse PR-3 behavior, and verify deterministic tests for first-seen, replay, and mismatch paths.
- This PR is the pilot for broader route conversion work planned in PR-5.

## Checklist

- [ ] `POST /api/list` accepts the operation envelope contract
- [ ] First-seen request returns deterministic success metadata
- [ ] Replay does not create a second list
- [ ] Payload mismatch returns deterministic rejection
- [ ] Invalid envelope validation fails cleanly at the route boundary
- [ ] `test:ci`, `lint`, and `check-types` pass
- [ ] Scope remains limited to the pilot endpoint
```

## Task Checklist

- [ ] Update `apps/shopshop/src/app/api/(actions)/list/route.ts` to accept operation envelopes.
- [ ] Forward the parsed envelope to `createList()`.
- [ ] Return route-level idempotency metadata in the response.
- [ ] Update `apps/shopshop/src/app/api/(actions)/list/route.test.ts` for the new contract.
- [ ] Add replay and payload-mismatch route tests.
- [ ] Verify lint: `pnpm --filter shopshop lint`.
- [ ] Verify types: `pnpm --filter shopshop check-types`.
- [ ] Verify tests: `pnpm --filter shopshop test:ci`.

## Definition of Done

- [ ] Pilot endpoint fully uses the operation envelope contract.
- [ ] Replay and mismatch behavior are covered at the route level.
- [ ] No additional endpoints are converted in this PR.
- [ ] CI is green.
- [ ] PR scope stays focused on the pilot route only.


