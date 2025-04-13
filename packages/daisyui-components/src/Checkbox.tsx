"use client";

/**
 * General purpose checkbox field for the application.
 */

// External Modules ----------------------------------------------------------

import React, { InputHTMLAttributes } from "react";

// Internal Modules ----------------------------------------------------------

// Public Objects ------------------------------------------------------------

type Props = {
  // Optional CSS classes to apply to the checkbox field.
  className?: string;
  // Optional disabled state for the checkbox field.
  disabled?: boolean;
  // The label for the checkbox field.
  label: string;
  // HTML name (and id) of the checkbox field.
  name: string;
  // Optional event handler for blur events.
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  // Optional event handler for change events.
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  // Optional initial value for the checkbox field.
  value?: boolean | undefined;
} & InputHTMLAttributes<HTMLInputElement>;

export function Checkbox({
  className,
  disabled,
  label,
  name,
  onBlur,
  onChange,
  value,
  ...props
}: Props) {
  return (
    <fieldset className={"fieldset w-full grid grid-cols-2 gap-1"}>
      <input
        checked={value ? value : undefined}
        className={`checkbox checkbox-primary ${className ? className : ""}`}
        disabled={disabled ? disabled : undefined}
        id={name}
        name={name}
        onBlur={onBlur ? onBlur : undefined}
        onChange={onChange ? onChange : undefined}
        type="checkbox"
        {...props}
      />
      <legend className="fieldset-legend">
        <label htmlFor={name}>{label}</label>
      </legend>
    </fieldset>
  );
}
