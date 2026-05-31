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

## Development Rules

- Group the mutations for each major object model (e.g. *Profile*, *Item*, etc.)
  into a single file named `{Model}Actions.ts` (e.g. `ProfileActions.ts`,
  `ItemActions.ts`, etc.).  Filename is PascalCase, not camelCase or lowercase.
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
- Lightweight validation that has no side effects (for example, validating an
  ID format with Zod) may be performed before authentication/authorization.
  This ordering is acceptable when it keeps the code simpler and avoids
  unnecessary database lookups.
- If the incoming request includes a data model, the mutation function
  **must** validate that data model, using Zod schemas defined in
  the `@repo/db-shopshop` package.
- Each mutation function will return an `ActionResult<{Model}>` object.
  If the operation was successful, it returns the mutated `{Model}` object itself.
  If the operation failed, it returns an error message, suitable for return
  to the caller and ultimately displayed to the user.
- In addition, logging (via the `ServerLogger` from `@repo/shared-utils`)
  should be used to record important events and errors.  Because these functions
  are only recorded in server-side logs, and not sent to the client,
  they can include sensitive information such as user IDs, email addresses, etc.
 
## Testing Rules

- **IMPORTANT**: Tests for these actions expect to be run against a test
  database that is seeded repeatedly from scratch.  If you run tests
  during development, **ALWAYS** ensure that you import the `.env.test`
  file containing the connection string for the test database.  The `test`
  and `test:ci` scripts are configured to do this automatically.  This will
  require specific attention in the GitHub CI workflow, to ensure that such
  an environment file is set up and used during testing.
- In tests, the `findProfile` function from `ProfileServerHelper` will return
  a test profile that is set (or not set for testing unauthenticated scenarios)
  via the `setTestProfile` function.  This allows tests to easily execute
  authenticated-or-not scenarios without having to involve (or mock)
  better-auth authentication.
- Modules in the `src/test` folder are solely for use in testing.
  - `SeedData` contains the test data that can be loaded into each table.
    The constants are exported so that tests can refer to them symbolically,
    rather than error-prone methods like indexing into arrays or hardcoding values.
  - `BaseUtils` contains a `loadData` method that erases the complete
    contents of the database, and only loads the tables that are requested.
    Use this to minimize the amount of data that needs to be set up for each test.
  - If you seed Lists (by using the `withLists` option of `loadData`), the
    Category and Item data for each List will be seeded from `InitialListData`.
  - If you seed Members (by using the `withMembers` option of `loadData`, along
    with the `withProfiles` and `withMembers` options), `Member` relationships
    between `Profiles` and `Lists` will be established programmatically.
  - `ActionUtils` extends `BaseUtils` and adds commonly used lookup functions
    for acquiring data needed for particular test scenarios.

