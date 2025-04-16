"use client";

/**
 * TanStack Form submit button component.
 */

// External Modules ----------------------------------------------------------

import { LoaderCircle } from "lucide-react";
import { ButtonHTMLAttributes } from "react";
// @ts-expect-error React is unused
import React from "react";

// Internal Modules ----------------------------------------------------------

import { useFormContext } from "./useAppContexts";

// Public Objects ------------------------------------------------------------

export type SubmitButtonProps = {
  // Optional CSS classes to apply to the button.
  className?: string;
  // Are we creating a new object?  [false]
  isCreating?: boolean;
  // Optional label for the button.  [Save]
  label?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function SubmitButton({
  className,
  isCreating,
  label,
  ...props
}: SubmitButtonProps) {
  const form = useFormContext();
  const { isSubmitting } = form.state;

  return (
    <form.Subscribe
      selector={(state) =>
        isCreating ? state.isValid && !state.isPristine : state.isValid
      }
    >
      {(canSubmit) => (
        <button
          className={`btn btn-primary ${className}`}
          disabled={!canSubmit}
          role="button"
          type="submit"
          {...props}
        >
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <span>{label ? label : "Save"}</span>
          )}
        </button>
      )}
    </form.Subscribe>
  );
}
