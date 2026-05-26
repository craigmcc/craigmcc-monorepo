# ShopShop

ShopShop is a collaborative shopping-list app in this monorepo.

## Docs Index

- `apps/shopshop/REQUIREMENTS.md` — product scope, user stories, and constraints
- `apps/shopshop/ARCHITECTURE.md` — server boundaries, authz model, and operation design
- `apps/shopshop/TECH_STACK.md` — runtime, dependencies, and tooling choices
- `apps/shopshop/CONTRIBUTING.md` — local workflow, quality checks, and PR expectations
- `apps/shopshop/.github/copilot-instructions.md` — app-local coding instructions for AI-assisted changes

## Quick Start (from monorepo root)

```bash
pnpm --filter shopshop dev
```

## Quality Checks (from monorepo root)

```bash
pnpm --filter shopshop test:ci
pnpm --filter shopshop lint
pnpm --filter shopshop check-types
```

