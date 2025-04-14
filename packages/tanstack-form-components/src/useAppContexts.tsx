"use client";

/**
 * Contexts and hooks for TanStack Form fields and forms.
 */

// External Modules ----------------------------------------------------------

import { createFormHookContexts } from "@tanstack/react-form";

// Internal Modules ----------------------------------------------------------

// Public Objects ------------------------------------------------------------

// prettier-ignore
export const { fieldContext, formContext, useFieldContext, useFormContext }
  = createFormHookContexts();
