/**
 * Tests for ListForm modal close behavior.
 */

// External Imports ----------------------------------------------------------

import { renderWithProviders } from "@repo/testing-react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Internal Imports ----------------------------------------------------------

import { ListForm } from "@/components/lists/ListForm";
import type { ListPlus } from "@/types/Types";

// Public Objects ------------------------------------------------------------

describe("ListForm", () => {
  const originalClose = HTMLDialogElement.prototype.close;

  beforeAll(() => {
    Object.defineProperty(HTMLDialogElement.prototype, "close", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterAll(() => {
    Object.defineProperty(HTMLDialogElement.prototype, "close", {
      configurable: true,
      value: originalClose,
    });
  });

  it("calls onClose(false) when the modal close button is pressed", async () => {
    const onClose = vi.fn();

    const { getByLabelText, user } = renderWithProviders(
      <ListForm
        onClose={onClose}
      />,
    );

    await user.click(getByLabelText("Close dialog"));

    expect(onClose).toHaveBeenCalledWith(false);
  });

  it("calls onClose(false) when delete cancel is pressed", async () => {
    const onClose = vi.fn();

    const { getByText, user } = renderWithProviders(
      <ListForm
        deleting
        list={makeList()}
        onClose={onClose}
      />,
    );

    await user.click(getByText("Cancel"));

    expect(onClose).toHaveBeenCalledWith(false);
  });
});

// Private Objects -----------------------------------------------------------

function makeList(): ListPlus {
  return {
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    id: "11111111-1111-4111-8111-111111111111",
    imageUrl: null,
    name: "Groceries",
    private: false,
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}




