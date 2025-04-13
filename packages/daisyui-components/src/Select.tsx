"use client";

/**
 * General purpose selector for the application.
 *
 * @packageDocumentation
 */

// External Modules ----------------------------------------------------------

// @ts-expect-error React is unused
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
  // The label for the select field (if any).
  label?: string;
  // HTML name of the select field.
  name: string;
  // Event handler for change events.
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  // The options for the select field (including header if any).
  options: SelectOption[];
} & SelectHTMLAttributes<HTMLSelectElement>;

export function Select({
  className,
  label,
  name,
  onChange,
  options,
  ...props
}: Props) {
  return (
    <fieldset className={`fieldset w-full ${label ? "grid-cols-2" : ""}`}>
      {label && (
        <legend className="fieldset-legend">
          <label htmlFor={name}>{label}</label>
        </legend>
      )}
      <select
        className={`select w-full ${className ? className : ""}`}
        id={name}
        name={name}
        onChange={onChange}
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
