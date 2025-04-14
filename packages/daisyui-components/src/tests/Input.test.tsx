"use client";

// External Modules ----------------------------------------------------------

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
//import { userEvent } from "@testing-library/user-event";
// @ts-expect-error React is unused
import React from "react";
import { describe, expect, it } from "vitest";

// Internal Modules ----------------------------------------------------------

import { Input } from "../Input";

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
const NAME = "test-input";
const PLACEHOLDER = "Enter text here";
//const VALUE = "Test Value";

describe("Input", () => {
  it("should render an input field as expected", () => {
    // prettier-ignore
    render(<Input
      label={LABEL}
      name={NAME}
      placeholder={PLACEHOLDER}
      type="text"
    />);
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
