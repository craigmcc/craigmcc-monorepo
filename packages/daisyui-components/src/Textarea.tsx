"use client";

/**
 * General purpose textarea field for the application.
 */

// External Modules ----------------------------------------------------------

import React, { TextareaHTMLAttributes } from "react";

// Internal Modules ----------------------------------------------------------

// Public Objects ------------------------------------------------------------

type Props = {
  // Optional CSS classes to apply to the textarea field.
  className?: string;
  // Optional disabled state for the textarea field.
  disabled?: boolean;
  // The label for the textarea field.
  label: string;
  // HTML name (and id) of the textarea field.
  name: string;
  // Optional event handler for blur events.
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  // Optional event handler for change events.
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  // Optional placeholder text for the textarea field.
  placeholder?: string;
  // Optional initial value for the textarea field.
  value?: string | number | readonly string[] | undefined;
  // Should the label be displayed above the textarea field?
  vertical?: boolean;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({
  className,
  disabled,
  label,
  name,
  onBlur,
  onChange,
  placeholder,
  value,
  vertical,
  ...props
}: Props) {
  return (
    // prettier-ignore
    <fieldset className={`fieldset w-full ${vertical ? "grid-cols-1" : "grid-cols-2 gap-1"}`}>
      <legend className="fieldset-legend">
        <label htmlFor={name}>{label}</label>
      </legend>
      <textarea
        className={`textarea textarea-bordered w-full ${className ? className : ""}`}
        disabled={disabled ? disabled : undefined}
        id={name}
        name={name}
        onBlur={onBlur ? onBlur : undefined}
        onChange={onChange ? onChange : undefined}
        placeholder={placeholder ? placeholder : undefined}
        value={value ? value : undefined}
        {...props}
      />
    </fieldset>
  );
}
