"use client";

/**
 * General purpose selector for the application.
 */

// External Modules ----------------------------------------------------------

import React, { ChangeEvent, SelectHTMLAttributes } from "react";

// Internal Modules ----------------------------------------------------------

// Public Objects ------------------------------------------------------------

export type SelectOption = {
  // The label of the option.
  label: string;
  // The value of the option. By convention, a value of "" is used
  // to mark an option as disabled, and not selectable. This is handy
  // if you need a "placeholder" like option at the top of the list.
  value: string;
};

type Props = {
  // Optional CSS classes to apply to the select field.
  className?: string;
  // Optional disabled state for the select field.
  disabled?: boolean;
  // The label for the select field.
  label: string;
  // HTML name of the select field.
  name: string;
  // Optional event handler for blur events.
  onBlur?: (event: React.FocusEvent<HTMLSelectElement>) => void;
  // Optional event handler for change events.
  onChang?: (event: ChangeEvent<HTMLSelectElement>) => void;
  // The options for the select field (including header if any).
  options: SelectOption[];
  // Should the label be displayed above the select field?
  vertical?: boolean;
} & SelectHTMLAttributes<HTMLSelectElement>;

export function Select({
  className,
  disabled,
  label,
  name,
  onBlur,
  onChange,
  options,
  vertical,
  ...props
}: Props) {
  return (
    // prettier-ignore
    <fieldset className={`fieldset w-full grid ${vertical ? "grid-cols-1" : "grid-cols-2 gap-1"}`}>
      <legend className="fieldset-legend">
        <label htmlFor={name}>{label}</label>
      </legend>
      <select
        className={`select w-full ${className ? className : ""}`}
        disabled={disabled ? disabled : undefined}
        id={name}
        name={name}
        onBlur={onBlur ? onBlur : undefined}
        onChange={onChange ? onChange : undefined}
        {...props}
      >
        {options.map((option) => (
          <option
            disabled={option.value === ""}
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </fieldset>
  );
}
