import { renderWithProviders } from "@repo/testing-react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import users from "@/data/users.json";

import { TanstackTable } from "./TanstackTable";

function getFirstRowName(container: HTMLElement) {
  const firstRow = container.querySelector("tbody tr");
  if (!firstRow) {
    return null;
  }

  const cells = firstRow.querySelectorAll("td");
  if (cells.length < 2) {
    return null;
  }

  return cells[1]?.textContent ?? null;
}

describe("TanstackTable", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("renders filter inputs and first-page rows", () => {
    const { getByLabelText, getByText, queryByText } = renderWithProviders(
      <TanstackTable users={users} />
    );

    expect(getByLabelText("Filter by Name:")).toBeTruthy();
    expect(getByLabelText("Filter by Email:")).toBeTruthy();
    expect(getByLabelText("Filter by Phone:")).toBeTruthy();

    expect(getByText("Leanne Graham")).toBeTruthy();
    expect(getByText("Chelsey Dietrich")).toBeTruthy();
    expect(queryByText("Kurtis Weissnat")).toBeNull();
  });

  it("filters by name", async () => {
    const { getByLabelText, getByText, queryByText, user } = renderWithProviders(
      <TanstackTable users={users} />
    );

    await user.type(getByLabelText("Filter by Name:"), "Kurtis Weissnat");

    await vi.waitFor(() => {
      expect(getByText("Kurtis Weissnat")).toBeTruthy();
      expect(queryByText("Leanne Graham")).toBeNull();
    });
  });

  it("filters by email and phone", async () => {
    const { getByLabelText, getByText, queryByText, user } = renderWithProviders(
      <TanstackTable users={users} />
    );

    await user.type(getByLabelText("Filter by Email:"), "rosamond.me");

    await vi.waitFor(() => {
      expect(getByText("Nicholas Runolfsdottir V")).toBeTruthy();
      expect(queryByText("Leanne Graham")).toBeNull();
    });

    await user.clear(getByLabelText("Filter by Email:"));
    await user.type(getByLabelText("Filter by Phone:"), "024-648-3804");

    await vi.waitFor(() => {
      expect(getByText("Clementina DuBuque")).toBeTruthy();
      expect(queryByText("Nicholas Runolfsdottir V")).toBeNull();
    });
  });

  it("applies multiple filters as an intersection", async () => {
    const { getByLabelText, getByText, queryByText, user } = renderWithProviders(
      <TanstackTable users={users} />
    );

    await user.type(getByLabelText("Filter by Name:"), "Clement");
    await user.type(getByLabelText("Filter by Email:"), "karina.biz");

    await vi.waitFor(() => {
      expect(getByText("Clementina DuBuque")).toBeTruthy();
      expect(queryByText("Clementine Bauch")).toBeNull();
    });

    await user.type(getByLabelText("Filter by Phone:"), "no-match");

    await vi.waitFor(() => {
      expect(queryByText("Clementina DuBuque")).toBeNull();
      expect(getByText(/Total of 0 Rows/)).toBeTruthy();
    });
  });

  it("sorts by Name when the Name sort control is clicked", async () => {
    const { container, getByRole, user } = renderWithProviders(
      <TanstackTable users={users} />
    );

    expect(getFirstRowName(container)).toBe("Leanne Graham");

    const nameHeader = getByRole("columnheader", { name: /Name/i });
    const sortControl = nameHeader.querySelector("span[style]") as HTMLSpanElement | null;
    expect(sortControl).toBeTruthy();

    await user.click(sortControl as HTMLSpanElement);

    await vi.waitFor(() => {
      expect(getFirstRowName(container)).toBe("Chelsey Dietrich");
    });

    await user.click(sortControl as HTMLSpanElement);

    await vi.waitFor(() => {
      expect(getFirstRowName(container)).toBe("Patricia Lebsack");
      expect(nameHeader.querySelector("svg.lucide-arrow-down-a-z")).toBeTruthy();
    });
  });
});
