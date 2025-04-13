"use client";

/**
 * General purpose input field for the application.
 *
 * @packageDocumentation
 */

// External Modules ----------------------------------------------------------

import React, { InputHTMLAttributes } from "react";

// Internal Modules ----------------------------------------------------------

// Public Objects ------------------------------------------------------------

type Props = {
  // Optional CSS classes to apply to the input field.
  className?: string;
  // The label for the input field (if any).
  label?: string;
  // HTML name (and id) of the input field.
  name: string;
  // Optional event handler for blur events.
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  // Optional event handler for change events.
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  // Optional placeholder text for the input field.
  placeholder?: string;
  // Optional HTML type for the input field. [text]
  type?: string;
  // Optional initial value for the input field.
  value?: string | number | readonly string[] | undefined;
} & InputHTMLAttributes<HTMLInputElement>;

export function Input({
  className,
  label,
  name,
  onBlur,
  onChange,
  placeholder,
  type,
  value,
  ...props
}: Props) {
  return (
    <fieldset className={`fieldset w-full ${label ? "grid-cols-2" : ""}`}>
      {label && (
        <legend className="fieldset-legend">
          <label htmlFor={name}>{label}</label>
        </legend>
      )}
      <input
        className={`input input-bordered w-full ${className ? className : ""}`}
        id={name}
        name={name}
        onBlur={onBlur ? onBlur : undefined}
        onChange={onChange ? onChange : undefined}
        placeholder={placeholder ? placeholder : undefined}
        type={type ? type : "text"}
        value={value ? value : undefined}
        {...props}
      />
    </fieldset>
  );
}
