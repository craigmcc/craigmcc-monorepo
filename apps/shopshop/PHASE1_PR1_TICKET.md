# Phase 1 PR-1: Shared operation envelope types and validation

## Objective

Establish a shared TypeScript type system and Zod validation schemas for operation-aware writes. This foundation enables idempotency tracking and exactly-once semantics in subsequent phases, while maintaining backward compatibility with current endpoints.

## Scope

- Add shared `OperationEnvelope` type with required fields
- Define `OperationType` enum for all write operation categories
- Create Zod schemas for envelope structure and operation-specific payload validation
- Add helper utilities for schema version parsing and envelope validation
- **No behavior change to existing endpoints yet** — purely additive types and schemas

## Acceptance Criteria

- [ ] `OperationEnvelope` type is defined with all required fields
- [ ] `OperationType` enum covers all planned write operations
- [ ] Zod schemas exist for envelope and per-operation payloads
- [ ] All schemas have unit tests with valid/invalid cases
- [ ] Helper utilities are tested and documented
- [ ] No breaking changes to existing endpoint contracts
- [ ] CI passes: `pnpm --filter shopshop test:ci && lint && check-types`

## Suggested Files

Primary locations:
- `apps/shopshop/src/types/OperationEnvelope.ts` — Type definitions
- `apps/shopshop/src/zod-schemas/OperationEnvelopeSchema.ts` — Zod validation
- `apps/shopshop/src/zod-schemas/*Schema.ts` — Per-operation payload schemas (create new or extend existing)

Alternative (if server folder structure is introduced later):
- `apps/shopshop/src/server/dto/OperationEnvelope.ts`

## Deliverables

### 1. OperationEnvelope type definition

```typescript
// apps/shopshop/src/types/OperationEnvelope.ts

export type OperationType =
  | "createList"
  | "updateList"
  | "deleteList"
  | "createCategory"
  | "updateCategory"
  | "deleteCategory"
  | "createItem"
  | "updateItem"
  | "deleteItem"
  | "updateProfile";

export type OperationEnvelope<T = unknown> = {
  operationId: string; // UUID, idempotency key
  operationType: OperationType;
  listId?: string; // null for profile-scoped operations
  actorProfileId?: string; // resolved server-side when possible
  payload: T;
  clientTimestamp: Date;
  schemaVersion: number; // allow future evolution
};

// Version constant for parsers/migrations
export const OPERATION_ENVELOPE_SCHEMA_VERSION = 1;
```

### 2. Zod validation schemas

```typescript
// apps/shopshop/src/zod-schemas/OperationEnvelopeSchema.ts

import { z } from "zod";
import { OPERATION_ENVELOPE_SCHEMA_VERSION } from "@/types/OperationEnvelope";

export const OperationTypeSchema = z.enum([
  "createList",
  "updateList",
  "deleteList",
  "createCategory",
  "updateCategory",
  "deleteCategory",
  "createItem",
  "updateItem",
  "deleteItem",
  "updateProfile",
]);

// Envelope structure (payload is per-operation, so use unknown for now)
export const OperationEnvelopeSchema = z.object({
  operationId: z.string().uuid(),
  operationType: OperationTypeSchema,
  listId: z.string().uuid().optional(),
  actorProfileId: z.string().uuid().optional(),
  payload: z.unknown(), // payload validation delegated to per-operation schema
  clientTimestamp: z.date(),
  schemaVersion: z.literal(OPERATION_ENVELOPE_SCHEMA_VERSION),
});

export type OperationEnvelopeSchemaType = z.infer<typeof OperationEnvelopeSchema>;

// Helper to map operationType to its payload schema
export type OperationPayloadMap = {
  createList: ListCreateSchemaType;
  updateList: ListUpdateSchemaType;
  deleteList: { listId: string };
  // ... extend as other operations are added
};
```

### 3. Helper utilities

```typescript
// apps/shopshop/src/lib/OperationEnvelopeHelpers.ts

import { OperationEnvelopeSchema, OperationTypeSchema } from "@/zod-schemas/OperationEnvelopeSchema";
import type { OperationEnvelope } from "@/types/OperationEnvelope";

/**
 * Parse and validate an operation envelope.
 * @throws ZodError if validation fails
 */
export function parseOperationEnvelope(data: unknown): OperationEnvelope {
  return OperationEnvelopeSchema.parse(data);
}

/**
 * Safely parse (returns null on failure, logs error).
 */
export function tryParseOperationEnvelope(data: unknown): OperationEnvelope | null {
  try {
    return OperationEnvelopeSchema.parse(data);
  } catch (error) {
    console.error("OperationEnvelope parse error:", error);
    return null;
  }
}

/**
 * Check if a given operationType is valid.
 */
export function isValidOperationType(operationType: string): boolean {
  return OperationTypeSchema.safeParse(operationType).success;
}

/**
 * Generate a new operationId (UUID).
 */
export function generateOperationId(): string {
  return crypto.randomUUID();
}
```

## Test Cases

Create unit tests in `apps/shopshop/src/zod-schemas/*.test.ts` covering:

### Valid envelopes
- [ ] Minimal valid envelope (all required fields)
- [ ] Envelope with optional fields (listId, actorProfileId)
- [ ] Envelope with clientTimestamp as ISO string or Date

### Invalid envelopes
- [ ] Missing operationId
- [ ] operationId is not a valid UUID
- [ ] Missing operationType
- [ ] operationType is not a known enum value
- [ ] schemaVersion is not 1
- [ ] clientTimestamp is missing or not a date

### Helper utilities
- [ ] `generateOperationId()` produces valid UUIDs
- [ ] `parseOperationEnvelope()` throws ZodError on invalid input
- [ ] `tryParseOperationEnvelope()` returns null and logs on invalid input
- [ ] `isValidOperationType()` returns true/false correctly

## Task Checklist

- [ ] Create `OperationEnvelope.ts` with type definitions
- [ ] Create `OperationEnvelopeSchema.ts` with Zod schemas
- [ ] Create `OperationEnvelopeHelpers.ts` utility functions
- [ ] Add comprehensive unit tests for all schemas and helpers
- [ ] Verify no linting errors: `pnpm --filter shopshop lint`
- [ ] Verify no type errors: `pnpm --filter shopshop check-types`
- [ ] Verify tests pass: `pnpm --filter shopshop test:ci`
- [ ] Commit with clear message following CONTRIBUTING.md style
- [ ] Create PR and fill GitHub PR checklist

## Definition of Done

PR can be merged when:

- [x] All tasks above are complete
- [x] All CI checks pass (test:ci, lint, check-types)
- [x] Code review: clarity, correctness, no unrelated changes
- [x] Test coverage: valid/invalid cases covered
- [x] Security: no unintended changes to authorization paths (N/A for this type-only PR)
- [x] Documentation: types and functions are JSDoc-commented
- [x] Ready to merge (approve your own PR, or leave for asynchronous review)

## Notes

- These types/schemas are **additive only** — no changes to existing endpoint behavior
- `schemaVersion` allows for non-breaking evolution (e.g., adding optional fields)
- `OperationPayloadMap` can be extended as new operations are added in later PRs
- Consider using `OPERATION_ENVELOPE_SCHEMA_VERSION` constant for consistency

## Branch and Commit Guidance

**Branch:** `phase1-pr1-operation-envelope`

**Commit message:**
```
Add operation envelope types and validation schemas

- Define OperationEnvelope type with required fields (operationId, operationType, etc.)
- Add Zod schemas for envelope structure and operation-type validation
- Implement helper utilities (parse, tryParse, isValidOperationType, generateOperationId)
- Add comprehensive unit tests for valid/invalid cases

No behavior change to existing endpoints.
Fixes: Phase 1 PR-1 (ARCHITECTURE.md)
```

---

## Success Metrics

Once merged, you should be able to:
- Import `OperationEnvelope` and `OperationType` in any file
- Validate JSON payloads against operation schemas
- Generate operation IDs consistently
- Use these types in PR-2 (idempotency persistence) without further changes





