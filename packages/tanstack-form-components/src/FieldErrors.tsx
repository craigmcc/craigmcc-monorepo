"use client";

/**
 * TanStack Form field errors component.
 */

// External Modules ----------------------------------------------------------

import { AnyFieldApi } from "@tanstack/react-form";
// @ts-expect-error React is unused
import React from "react";

// Internal Modules ----------------------------------------------------------

// Public Objects ------------------------------------------------------------

export function FieldErrors({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {field.state.meta.errors && (
        <div className="label">
          <span className="label-text-alt text-error">
            {field.state.meta.errors.map((e: Error) => e.message).join(", ")}
          </span>
        </div>
      )}
    </>
  );
}
