/**
 * The result of an action that may return a value or an error (or both).
 */

// External Modules ----------------------------------------------------------

import { z, ZodError } from "zod";

// Internal Modules ----------------------------------------------------------

// Public Objects ------------------------------------------------------------

/**
 * Default error messages for common problems.
 */
export const ERRORS = {
  AUTHENTICATION: "This Profile is not signed in",
  DATA_VALIDATION: "Request data does not pass validation",
  ID_VALIDATION: "Specified ID does not pass validation",
  INTERNAL_SERVER_ERROR: "Internal Server Error occurred",
};

/**
 * The list of valid HTTP error status codes that can be returned in the
 * "status" field when a "message" is returned.  The interpretation of what
 * each status code means, in the context of our applications, is described
 * in parentheses after each allowed code.
 *
 * It is reasonable to consider expanding this list if development indicates
 * that another choice would be better.  However, the list should NEVER be
 * reduced due to potential for breaking existing uses.
 */
export type ActionResultStatus =
    400 // Bad Request (data validation error)
  | 401 // Unauthorized (not signed in)
  | 403 // Forbidden (authorization failure)
  | 404 // Not Found (attempted to access a nonexistent value)
  | 409 // Conflict (would violate a database constraint if completed)
  | 500 // Internal Server Error (action function threw an error)
;

/**
 * The result of an action that may return an error message or a model object
 * (or both).  For cases where the action failed because of schema validation
 * issues, a set of form errors (individual strings) global to the entire
 * result, and/or a set of field errors (keyed by field name) specific to
 * this model object are returned.
 *
 * @param M                             The type of model object being returned
 */
export type ActionResult<M> = {
  // Field errors (if any) keyed by field name (based on ZodError flattened)
  fieldErrors?: {
    [p: string]: string[] | undefined;
    [p: number]: string[] | undefined;
    [p: symbol]: string[] | undefined
  } | undefined;
  // Form errors (if any) global to the entire result (based on ZodError flattened
  formErrors?: string[] | undefined;
  // Message describing the error that occurred (if any)
  message?: string | undefined;
  // The model object returned by the action (if any)
  model?: M | undefined;
  // The HTTP status describing the type of error, to be returned to clients.
  // If not specified, HTTP clients should receive a status of 400.
  status?: ActionResultStatus;
}

/**
 * Shortcut for an ActionResult that returns validation errors.
 *
 * @param M                             The type of model object being returned
 * @param error                         The ZodError that caused the failure
 * @param message                       Optional message to include in the result
 */
export function ValidationActionResult<M>(error: ZodError, message?: string): ActionResult<M> {
  const flattened = z.flattenError(error);
  return {
    fieldErrors: flattened.fieldErrors || undefined,
    formErrors: flattened.formErrors || undefined,
    message: message ? message : ERRORS.DATA_VALIDATION,
    status: 400,
  };
}
