# Action HTTP Endpoints

## Introduction

This directory contains API route handlers that expose the server-side actions defined in the
`actions/` directory as HTTP endpoints.  These endpoints are intended to be called from client-side
code (e.g. React components) and from mobile applications.

For actions that perform mutations, these endpoints can rely on the fact that the required
authentication, authorization, and validation checks will occur inside the underlying action
being called.  If endpoints for fetch operations are added later (not part of the current plan),
the relevant checks will need to be applied in the route handers themselves.

## Development Rules

- Per Next.js conventions, each file must be named `route.ts`, and placed inside a folder
  that defines the corresponding URL path.  (These folders are all in the `(actions)`
  route group, so they will not affect the URL path.)
- The HTTP method (POST, PUT, DELETE) used for each endpoint should be consistent with
  standard RESTful conventions (create, update, and delete respectively).
- Each endpoint should call the corresponding action function from the `actions/`
  directory, and return either the model returned in the ActionResult (on success),
  or an appropriate error response containing the error message (on failure).
- Path URLs should require a minimum number of path parameters.  For example,
  `PUT /api/profile` works because the signed-in profile will be determined by the
  action being called -- or it will return an error if the caller is not signed in.
- TODO: Clarify how to determine the appropriate HTTP status code for different types
  of errors.  This will likely require an optional return value from the action functions
  to indicate the desired status code, rather than relying on fragile text comparisons
  of the returned message.

## Testing Rules

- Because tests are executed against a test database that is seeded from scratch, the
  API routes should call the actual action methods instead of mocking them.  This will
  ensure that we are testing the full stack of functionality, not something that
  a mock pretends to do correctly.
- Such tests should be placed in the same folder as the `route.ts` file itself.
  They are all (obviously) `e2e` tests, so they do not need a specific suffix or subfolder.
