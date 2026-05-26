# Monorepo Copilot Instructions

These instructions apply to all apps and packages unless a more specific local instruction file says otherwise.

## Scope and precedence

- Global defaults live here.
- App/package-specific docs may add constraints for that scope.
- If rules conflict, prefer the most specific scope.

## Architecture and changes

- Keep changes small, focused, and reversible.
- Do not include unrelated refactors in feature/fix commits.
- Respect existing package boundaries and import aliases.
- Prefer shared utilities/components from `packages/*` before introducing duplicates.

## TypeScript

- Use strict typing; avoid `any` unless unavoidable.
- Prefer explicit return types for exported functions.
- Keep public API types stable; if changing contracts, document impact.

## Testing

- Add or update tests for behavior changes.
- In this monorepo, prefer CI-mode test scripts (for example `test:ci`) over watch-mode scripts.
- Keep tests deterministic and avoid time/network flakiness.

## Security and auth

- Validate authorization at server boundaries, not only in UI.
- Avoid exposing privileged operations through loosely validated inputs.
- Do not log secrets or sensitive credentials.

## Logging and errors

- Emit actionable errors with context.
- Keep user-facing messages clear; keep sensitive internals in server logs only.

## Style

- Match existing formatting and naming conventions in the touched area.
- Keep comments concise and only where logic is non-obvious.
- Prefer ASCII unless the file already uses non-ASCII for a clear reason.

