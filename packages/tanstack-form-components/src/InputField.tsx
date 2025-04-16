"use client";

import React, { InputHTMLAttributes } from "react";
import { Input } from "@craigmcc/daisyui-components/Input";
import { FieldErrors } from "./FieldErrors";
import { useFieldContext } from "./useAppContexts";

export type InputFieldProps = {
  // Optional CSS classes to apply to the input field.
  className?: string;
  // Optional disabled state for the input field. [false]
  disabled?: boolean;
  // The label for the input field.
  label: string;
  // The name of the input field (must be unique with the form)
  name: string;
  // Optional onBlur event handler for the input field.
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  // Optional onChange event handler for the input field.
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  // Optional placeholder text for the input field.
  placeholder?: string;
  // Optional HTML type for the input field. [text]
  type?:
    | "button"
    | "checkbox"
    | "color"
    | "date"
    | "datetime-local"
    | "email"
    | "file"
    | "hidden"
    | "image"
    | "month"
    | "number"
    | "password"
    | "radio"
    | "range"
    | "reset"
    | "search"
    | "submit"
    | "tel"
    | "text"
    | "time"
    | "url"
    | "week";
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
}: InputFieldProps) {
  const field = useFieldContext<string>();

  return (
    <Input
      className={className}
      disabled={disabled}
      label={label}
      name={name}
      onBlur={onBlur}
      onChange={onChange}
      placeholder={placeholder}
      type={type || "text"}
      value={value}
      vertical={true}
      {...props}
    >
      <FieldErrors field={field} />
    </Input>
  );
}
