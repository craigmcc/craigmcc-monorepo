import { describe, expect, it } from "vitest";

import { getComponentDoc, getDocIndex } from "@/lib/docs";

describe("docs metadata index", () => {
  it("returns available component docs", async () => {
    const entries = await getDocIndex();
    const slugs = entries.map((entry) => entry.slug);

    // Core expected docs should always be present.
    expect(slugs).toEqual(expect.arrayContaining(["button", "input", "menu", "modal", "navbar"]));
    // Index should be sorted by title for stable navigation.
    const titles = entries.map((entry) => entry.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
  });

  it("resolves a component detail by slug", async () => {
    const meta = await getComponentDoc("button");
    expect(meta?.component).toBe("Button");
  });
});
