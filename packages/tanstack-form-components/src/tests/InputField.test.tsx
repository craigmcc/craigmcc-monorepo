"use client";

// External Modules ----------------------------------------------------------

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
//import { userEvent } from "@testing-library/user-event";
// @ts-expect-error React is unused
import React from "react";
import { describe, expect, it } from "vitest";
//import { object, string, z } from "zod";

// Internal Modules ----------------------------------------------------------

import { useAppForm } from "../useAppForm";

// Test Hooks ----------------------------------------------------------------

// Test Infrastructure -------------------------------------------------------

function elements(labelText: string) {
  const input = screen.getByLabelText(labelText);
  return {
    input,
  };
}

// Test Objects --------------------------------------------------------------

const LABEL = "Test Input";
const NAME = "name";
const PLACEHOLDER = "Enter text here";
//const VALUE = "Test Value";

/*
const schema = object({
  name: string(),
});
type schemaType = z.infer<typeof schema>;
*/

// TODO - cannot call useAppForm in a test since it is not in a component
describe.todo("InputField", () => {
  it("should render an input field as expected", () => {
    const form = useAppForm({
      defaultValues: { name: NAME },
    });
    render(
      <form.AppField name="name">
        {(field) => (
          <field.InputField
            label={LABEL}
            name={NAME}
            placeholder={PLACEHOLDER}
            type="text"
          />
        )}
      </form.AppField>
    );
    const { input } = elements(LABEL);
    expect(input).toBeInTheDocument();
    expect(input).not.toHaveAttribute("disabled");
    expect(input).toHaveAttribute("id", NAME);
    expect(input).toHaveAttribute("name", NAME);
    expect(input).not.toHaveAttribute("onBlur");
    expect(input).not.toHaveAttribute("onChange");
    expect(input).toHaveAttribute("placeholder", PLACEHOLDER);
    expect(input).toHaveAttribute("type", "text");
    expect(input).not.toHaveAttribute("value");
  });
});
