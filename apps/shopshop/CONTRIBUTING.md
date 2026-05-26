# Contributing (ShopShop)

## Scope

This guide applies to `apps/shopshop/*`.

## Before you start

- Review `apps/shopshop/REQUIREMENTS.md` for product behavior.
- Review `apps/shopshop/TECH_STACK.md` for technical constraints.

## Local workflow

1. Make focused changes for one behavior at a time.
2. Add/update tests for changed behavior.
3. Run CI-mode checks locally before pushing.

## Commands

Run from monorepo root.

```bash
pnpm --filter shopshop test:ci
pnpm --filter shopshop lint
pnpm --filter shopshop check-types
```

If a script name differs in `apps/shopshop/package.json`, use the available equivalent.

## Auth and security expectations

- Do not put privileged behavior behind client-only checks.
- Enforce role/ownership checks on the server side.
- Avoid introducing server actions that can mutate shared data without validating caller authorization.

## Shopping-state semantics

- `selected=true`: item appears in active shopping view.
- `checked=true`: item is acquired and remains visible (crossed out) while selected.
- Clear action is non-destructive and sets both flags to `false` for all list items.

## Pull request checklist

- [ ] Requirement alignment verified against `apps/shopshop/REQUIREMENTS.md`
- [ ] Tests added/updated and passing via `test:ci`
- [ ] No unrelated refactors
- [ ] Security/authorization checks validated for changed server paths


