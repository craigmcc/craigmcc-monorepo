"use client";

/**
 * TanStack Form input field component.
 */

// External Modules ----------------------------------------------------------

import React, { InputHTMLAttributes } from "react";

// Internal Modules ----------------------------------------------------------

import { FieldErrors } from "./FieldErrors";
import { useFieldContext } from "./useAppContexts";
import { Input } from "@craigmcc/daisyui-components/Input"

// Public Objects ------------------------------------------------------------

type Props = {
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
} & InputHTMLAttributes<HTMLInputElement>;

export function InputField({
  className,
  disabled,
  label,
  name,
  onBlur,
  onChange,
  placeholder,
  type,
  value,
  ...props
}: Props) {
  const field = useFieldContext<string>();

  return (
    <Input
      className={className ? className : undefined}
      disabled={disabled ? disabled : undefined}
      label={label}
      name={name}
      onBlur={onBlur ? onBlur : undefined}
      onChange={onChange ? onChange : undefined}
      placeholder={placeholder ? placeholder : undefined}
      value={value ? value : undefined}
      vertical={true}
    >
      <FieldErrors field={field} />
    </Input>
  );
}
