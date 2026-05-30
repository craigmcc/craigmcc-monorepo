# Actions

## Introduction

This directory contains server-side modules that perform mutations
against the underlying database.  They are not technically "server actions"
or "server functions" in the sense that React and Next.js use those terms,
(they lack the "use server" directive at the top of each file). This is
because we want them to be callable from mobile applications (via API routes)
as well as from server-rendered React components.

The API routes that will call these actions (in `app/api/`) are **not**
responsible for performing authentication or authorization checks.
Those checks should be performed by the actions themselves, so that they are
safe to call from any context.

## Coding Rules

- Group the mutations for each major object model (e.g. *Profile*, *Member*, etc.)
  into a single file named `{Model}Actions.ts` (e.g. `ProfileActions.ts`,
  `MemberActions.ts`, etc.).  Filename is PascalCase, not camelCase or lowercase.
- Each file should export a set of functions that perform mutations related to
  that model.  For example, `CategoryActions.ts` might export functions like
  `createCategory`, `updateCategory`, `deleteCategory`, etc.
- Each function **must** perform its own authentication and authorization checks.
  This will typically involve calling the `findProfile` function from
  `ProfileServerHelper` to retrieve the `Profile` of the caller (if they
  have signed in), followed by whatever verification is necessary to ensure
  that the caller has permission to perform the requested action (for example,
  checking that the caller is a `Member` of the `List` that they are
  attempting to modify).
- If the incoming request includes a data model, the mutation function
  **must** validate that data model, using Zod schemas defined in
  the `@repo/db-shopshop` package.
- Each mutation function will return an `ActionResult<{Model}` object.
  If the operation was successful, it returns the mutated `{Model}` object itself.
  If the operation failed, it returns an error message, suitable for return
  to the caller and ultimately displayed to the user.
- In addition, logging (via the `ServerLogger` from `@repo/shared-utils`)
  should be used to record important events and errors.  Because these functions
  are only recorded in server-side logs, and not sent to the client,
  they can include sensitive information such as user IDs, email addresses, etc.
 
## Testing Rules

TODO.

