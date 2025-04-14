"use client";

/**
 * General purpose input field for the application.
 */

// External Modules ----------------------------------------------------------

import React, { InputHTMLAttributes } from "react";

// Internal Modules ----------------------------------------------------------

// Public Objects ------------------------------------------------------------

type Props = {
  // Optional children to render inside the fieldset.
  children?: React.ReactNode;
  // Optional CSS classes to apply to the input field.
  className?: string;
  // Optional disabled state for the input field.
  disabled?: boolean;
  // The label for the input field.
  label: string;
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
  // Should the label be displayed above the input field?
  vertical?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

export function Input({
  children,
  className,
  disabled,
  label,
  name,
  onBlur,
  onChange,
  placeholder,
  type,
  value,
  vertical,
  ...props
}: Props) {
  return (
    // prettier-ignore
    <fieldset className={`fieldset w-full grid ${vertical ? "grid-cols-1" : "grid-cols-2 gap-1"}`}>
      <legend className="fieldset-legend">
        <label htmlFor={name}>{label}</label>
      </legend>
      <input
        className={`input input-bordered w-full ${className ? className : ""}`}
        disabled={disabled ? disabled : undefined}
        id={name}
        name={name}
        onBlur={onBlur ? onBlur : undefined}
        onChange={onChange ? onChange : undefined}
        placeholder={placeholder ? placeholder : undefined}
        type={type ? type : "text"}
        value={value ? value : undefined}
        {...props}
      />
      {children}
    </fieldset>
  );
}
