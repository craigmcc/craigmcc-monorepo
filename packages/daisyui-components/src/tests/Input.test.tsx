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

const LABEL_TEXT = "Test Input";
const NAME = "test-input";
//const VALUE = "Test Value";

describe("Input", () => {
  it("should render an input field as expected", () => {
    // prettier-ignore
    render(<Input
      label={LABEL_TEXT}
      name={NAME}
      placeholder="Enter text here"
      type="text"
    />);
    const { input } = elements(LABEL_TEXT);
    expect(input).toBeDefined();
    expect(input).toHaveAttribute("id", NAME);
    expect(input).toHaveAttribute("name", NAME);
    expect(input).not.toHaveAttribute("onBlur");
    expect(input).not.toHaveAttribute("onChange");
    expect(input).toHaveAttribute("placeholder", "Enter text here");
    expect(input).toHaveAttribute("type", "text");
    expect(input).not.toHaveAttribute("value");
  });
});
