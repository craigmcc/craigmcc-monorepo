# Phase 1 PR-3: Idempotent execution wrapper for write operations

## Objective

Apply idempotency behavior to write paths using `OperationRecord` persistence from PR-2:
- First-seen requests execute normally and persist completion snapshots.
- Duplicate requests with same payload replay deterministic responses.
- Duplicate requests with different payload are rejected consistently.

## Scope

- Add/implement server-side idempotent execution wrapper/helper.
- Integrate wrapper into all write action modules in top-down parent-child order.
- Enforce payload-hash mismatch rejection behavior.
- Add tests covering first-seen, replay, mismatch, and race behavior.
- No unrelated API contract changes.

## Rollout Order

- `ProfileActions.ts` (top-level parent)
- `ListActions.ts` (child of Profile context)
- `CategoryActions.ts` (child of List)
- `ItemActions.ts` (child of Category)

## Implementation Plan

### Milestone 1 - `ProfileActions.ts`

Goal:
- Wire idempotent wrapper into `updateProfile()` as the first end-to-end integration.

Implementation:
- Define operation envelope parsing and payload hash generation path for `updateProfile()`.
- Use repository lookup/create/complete flow through wrapper.
- Preserve existing success and validation response contracts.

Expected tests:
- First-seen `updateProfile()` executes mutation and stores `COMPLETED` snapshot.
- Duplicate same key + same payload replays identical response.
- Duplicate same key + different payload returns deterministic conflict.

### Milestone 2 - `ListActions.ts`

Goal:
- Integrate idempotent wrapper for `createList()`, `updateList()`, and `deleteList()`.

Implementation:
- Add operation type mapping per action.
- Ensure transactional create path (`createList` + default population) is wrapped safely.
- Verify replay returns stored response and does not duplicate side effects.

Expected tests:
- First-seen create/update/delete flows still pass.
- Duplicate replay for each operation type does not re-run mutation.
- Payload mismatch conflict behavior for list operations.

### Milestone 3 - `CategoryActions.ts`

Goal:
- Integrate idempotent wrapper for `createCategory()`, `updateCategory()`, and `deleteCategory()`.

Implementation:
- Reuse wrapper conventions established in Profile/List milestones.
- Keep authorization and existing validation checks ahead of mutation semantics.
- Ensure category delete/update race handling remains deterministic with idempotency.

Expected tests:
- Existing category action tests remain green.
- New replay/mismatch tests for create/update/delete category operations.
- Ensure no additional category rows or deletes on replay.

### Milestone 4 - `ItemActions.ts`

Goal:
- Integrate idempotent wrapper for `createItem()`, `updateItem()`, and `deleteItem()`.

Implementation:
- Apply same wrapper contract and error mapping as earlier milestones.
- Verify item replay paths do not duplicate or double-delete rows.
- Confirm payload mismatch responses align with earlier modules.

Expected tests:
- Existing item action tests remain green.
- New replay/mismatch tests for create/update/delete item operations.
- Concurrent duplicate request test for at least one item mutation path.

### Cross-milestone hardening

- Add shared helper(s) if repetitive envelope/wrapper invocation patterns emerge.
- Keep each milestone commit small and reversible.
- Run full test/lint/type checks after each milestone before moving to the next.

## Acceptance Criteria

- [ ] First-seen request creates `PENDING`, executes mutation, and completes record.
- [ ] Duplicate same-key + same-payload replays stored response without re-running mutation.
- [ ] Duplicate same-key + different-payload returns conflict (deterministic status/message/code).
- [ ] Concurrent duplicate requests resolve deterministically (one writer, one replay/retry path).
- [ ] Tests cover create/replay/mismatch/race branches.
- [ ] CI passes: `pnpm --filter shopshop test:ci && lint && check-types`.

## Suggested Files

Primary:
- `apps/shopshop/src/lib/` (idempotent execution helper/wrapper)
- `apps/shopshop/src/actions/*Actions.ts` (write action integration)
- `apps/shopshop/src/app/api/(actions)/**/route.ts` (if route-level mapping is needed)
- `apps/shopshop/src/lib/*.test.ts` and/or action tests

Existing dependencies from PR-2:
- `apps/shopshop/src/lib/OperationRecordRepository.ts`
- `apps/shopshop/src/lib/OperationEnvelopeHelpers.ts`
- `apps/shopshop/src/zod-schemas/OperationEnvelopeSchema.ts`

## Test Cases

### First-seen execution
- [ ] Writes succeed and persist `COMPLETED` snapshot.
- [ ] Repository record has expected status/body/statusCode/completedAt.

### Replay
- [ ] Duplicate key + same payload returns stored snapshot.
- [ ] Underlying mutation side effects occur once.

### Payload mismatch
- [ ] Duplicate key + different payload returns conflict.
- [ ] Conflict code/message/status are stable and asserted.

### Race handling
- [ ] Two concurrent identical requests produce deterministic outcome.
- [ ] Unique-key create race is handled via repository unique detection path.

## Task Checklist

- [ ] Implement idempotent execution wrapper.
- [ ] Integrate wrapper into `apps/shopshop/src/actions/ProfileActions.ts`.
- [ ] Integrate wrapper into `apps/shopshop/src/actions/ListActions.ts`.
- [ ] Integrate wrapper into `apps/shopshop/src/actions/CategoryActions.ts`.
- [ ] Integrate wrapper into `apps/shopshop/src/actions/ItemActions.ts`.
- [ ] Add/adjust tests for all scenarios above.
- [ ] Verify lint: `pnpm --filter shopshop lint`.
- [ ] Verify types: `pnpm --filter shopshop check-types`.
- [ ] Verify tests: `pnpm --filter shopshop test:ci`.
- [ ] Open PR with focused change set only.

## Definition of Done

- [ ] Acceptance criteria complete.
- [ ] CI green.
- [ ] Replay/mismatch/race behavior test-covered.
- [ ] No unrelated refactors or contract drift.

## PR-3 Kickoff Checklist and Suggested Commits

### Kickoff Checklist

1. Branch setup
   - `git checkout main`
   - `git pull`
   - `git checkout -b phase1-pr3-idempotent-actions`

2. Baseline verification
   - Confirm ticket content in `apps/shopshop/PHASE1_PR3_TICKET.md`.
   - Run:
	 ```bash
	 cd "/Users/craigmcc/Git.Craigmcc/craigmcc-monorepo"
	 pnpm --filter shopshop check-types
	 pnpm --filter shopshop lint
	 pnpm --filter shopshop test:ci
	 ```

3. Milestone 1: Profile
   - Integrate idempotent wrapper into `ProfileActions.ts`.
   - Add/update tests for first-seen, replay, and mismatch.
   - Re-run validation commands.

4. Milestone 2: List
   - Integrate wrapper into `ListActions.ts` (`createList`, `updateList`, `deleteList`).
   - Add/update replay, mismatch, and side-effect tests.
   - Re-run validation commands.

5. Milestone 3: Category
   - Integrate wrapper into `CategoryActions.ts`.
   - Add/update replay and mismatch tests.
   - Re-run validation commands.

6. Milestone 4: Item
   - Integrate wrapper into `ItemActions.ts`.
   - Add/update replay, mismatch, and one concurrent duplicate test.
   - Re-run validation commands.

7. Final PR prep
   - Update ticket checkboxes.
   - Keep commits small/reviewable and squash only if needed.
   - Push branch and open draft PR.

### Suggested Commit Messages

1. `Add idempotent wrapper integration for Profile actions`
   - Integrate idempotent execution path into `updateProfile`.
   - Preserve existing response contract and validation behavior.
   - Add replay and payload-mismatch tests for profile updates.

2. `Integrate idempotent execution into List actions`
   - Apply wrapper to `createList`, `updateList`, and `deleteList`.
   - Ensure replay paths do not duplicate list side effects.
   - Add tests for first-seen, replay, and mismatch list flows.

3. `Integrate idempotent execution into Category actions`
   - Apply wrapper to `createCategory`, `updateCategory`, and `deleteCategory`.
   - Keep auth/validation flow intact before mutation behavior.
   - Add tests for category replay and payload-mismatch behavior.

4. `Integrate idempotent execution into Item actions`
   - Apply wrapper to `createItem`, `updateItem`, and `deleteItem`.
   - Ensure replay does not duplicate writes or delete twice.
   - Add tests for replay, mismatch, and one duplicate-race path.

5. Optional hardening: `Refine shared idempotency helpers and test coverage`
   - Consolidate repeated wrapper/envelope helper usage.
   - Improve error mapping consistency across action modules.
   - Add/adjust cross-module tests without changing API contracts.

## Pull Request Description Template

```markdown
## Summary

Implements Phase 1 PR-3 idempotent execution behavior for write actions using `OperationRecord` persistence introduced in PR-2.

This PR adds:
- first-seen execution with persisted completion snapshots
- replay for duplicate `(actorProfileId, operationId)` requests with same payload
- deterministic conflict handling for same key + different payload
- deterministic handling for duplicate create race paths

## Scope

Integrated idempotency into all write action modules in parent-child order:

1. `apps/shopshop/src/actions/ProfileActions.ts`
2. `apps/shopshop/src/actions/ListActions.ts`
3. `apps/shopshop/src/actions/CategoryActions.ts`
4. `apps/shopshop/src/actions/ItemActions.ts`

Related helper/repository usage:
- `apps/shopshop/src/lib/OperationRecordRepository.ts`
- `apps/shopshop/src/lib/OperationEnvelopeHelpers.ts`
- `apps/shopshop/src/lib/PrismaErrorHelpers.ts`

## Behavior Changes

- **First-seen request**
  - Creates `PENDING` operation record
  - Executes mutation
  - Stores terminal snapshot (`COMPLETED` or `REJECTED`) with response payload/status

- **Duplicate request with same payload**
  - Does not re-run mutation
  - Replays stored response snapshot deterministically

- **Duplicate request with different payload**
  - Returns deterministic conflict response
  - Marks appropriate terminal status/conflict metadata as needed

- **Concurrent duplicate requests**
  - Deterministic branch behavior through unique-key handling path

## What Did Not Change

- No unrelated refactors
- No broad contract redesign outside idempotency behavior
- No schema/migration changes beyond PR-2 foundation

## Testing

### Added/Updated
- Wrapper/repository and action-level tests for:
  - first-seen execution
  - replay behavior
  - payload mismatch conflict behavior
  - duplicate/race handling paths

### Verification Commands

```bash
cd "/Users/craigmcc/Git.Craigmcc/craigmcc-monorepo"
pnpm --filter shopshop test:ci
pnpm --filter shopshop lint
pnpm --filter shopshop check-types
```

## Risk / Rollout Notes

- Main risk is behavioral drift in action response mapping during replay/conflict branches.
- Mitigation: module-by-module rollout, deterministic tests, and preserving existing non-idempotency validation/auth flows.
- Rollout order intentionally follows dependency hierarchy: Profile -> List -> Category -> Item.

## Checklist

- [ ] First-seen path persists completion snapshot
- [ ] Replay path returns stored response without re-executing mutation
- [ ] Payload mismatch path returns deterministic conflict
- [ ] Duplicate/race handling path is deterministic
- [ ] `test:ci`, `lint`, and `check-types` pass
- [ ] Scope limited to PR-3 goals
```




