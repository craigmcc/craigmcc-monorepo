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

---

## Pull request workflow (solo developer)

This section provides a lightweight workflow for opening and merging PRs when working solo.

### Branch naming

Use descriptive names with a ticket/scope prefix:

```
phase1-pr1-operation-envelope
fix-profile-auth-check
feature-list-sharing
hotfix-race-condition
```

Pattern: `{type}-{brief-description}` where type is one of:
- `phase1-prN-*`: planned work from ARCHITECTURE.md
- `feature-*`: new capability
- `fix-*`: bug fix
- `hotfix-*`: urgent production issue
- `refactor-*`: code quality without behavior change

### Commit message style

Keep messages clear and single-topic:

```
Add operation envelope types and validation schemas

- Define OperationEnvelope type with required fields
- Add Zod schema for envelope + operationType-specific payload
- Include helper for schemaVersion parsing

Tests added for valid/invalid envelope parsing.
No behavior change to existing endpoints.
```

Guidelines:
- First line: ~50 chars, imperative mood ("Add", "Fix", not "Added", "Fixed")
- Blank line after subject
- Body: explain *why* and *what*, not *how*
- One logical change per commit

### Pre-push validation checklist

Before `git push`, run:

```bash
pnpm --filter shopshop test:ci
pnpm --filter shopshop lint
pnpm --filter shopshop check-types
```

All must pass before push. If any fail:
- Fix locally
- Amend commit or add new commit as needed
- Do not push broken branches to GitHub

### GitHub PR checklist (solo review)

When you open a PR, even as a solo dev, fill in the GitHub PR template with:

- [ ] Linked to relevant ARCHITECTURE.md phase/goal
- [ ] All CI checks pass (GitHub Actions)
- [ ] Test coverage added/updated
- [ ] No unrelated refactors in this PR
- [ ] Commit messages follow style guide
- [ ] Code review: re-read own changes for clarity/correctness
- [ ] Security: authorization checks validated (if touching server paths)
- [ ] Ready to merge (even though you're the only reviewer)

### Merge and cleanup

After PR merge on GitHub:

```bash
# Update local main and sync
git checkout main
git pull --ff-only

# Clean up local branch
git branch -d <branch-name>

# Clean up remote tracking
git push origin --delete <branch-name>
```

### Example solo workflow

```bash
# Start: ensure main is fresh
git checkout main
git pull --ff-only

# Create feature branch
git checkout -b phase1-pr1-operation-envelope

# Make changes, test locally
# ... edit files ...
pnpm --filter shopshop test:ci
pnpm --filter shopshop lint
pnpm --filter shopshop check-types

# Commit
git add apps/shopshop/src/types/* apps/shopshop/src/test/*
git commit -m "Add operation envelope types and validation"

# Push and open PR on GitHub
git push -u origin phase1-pr1-operation-envelope
# Open PR in browser, fill checklist, request own review or approve

# After merge on GitHub
git checkout main
git pull --ff-only
git branch -d phase1-pr1-operation-envelope
git push origin --delete phase1-pr1-operation-envelope
```

### Solo-specific tips

- **Single-threaded priority:** Only one active branch at a time keeps mental load low.
- **Rebase on main if needed:** If `main` advances while your PR is open, rebase locally and force-push: `git rebase main && git push --force-with-lease`.
- **Leave PR open briefly:** Even for solo work, leave the PR open for ~5 min before merging so GitHub CI completes and you catch any last-minute issues.
- **Tag your PRs:** Use GitHub labels (e.g., `phase1`, `type:feature`) so you can track progress toward long-term goals.


