/**
 * Behavior tests for shared filter schema parsing and serialization helpers.
 */

// External Imports ----------------------------------------------------------

import { describe, expect, it } from "vitest";

// Internal Imports ----------------------------------------------------------

import {
  applyFilterPatch,
  booleanCodec,
  createUrlSearchParamsIO,
  csvCodec,
  intCodec,
  parseFilters,
  serializeFilters,
  stringCodec,
  type FilterSchema,
} from "../filters";

// Public Objects ------------------------------------------------------------

// Private Objects -----------------------------------------------------------

type SearchFilters = {
  inStock: boolean;
  page: number;
  q: string;
  tags: string[];
};

const SEARCH_FILTER_SCHEMA: FilterSchema<SearchFilters> = {
  fields: [
    {
      codec: booleanCodec(),
      defaultValue: false,
      key: "inStock",
      queryKey: "inStock",
    },
    {
      codec: intCodec({ min: 1 }),
      defaultValue: 1,
      key: "page",
      normalize: (value) => Math.max(1, value),
      queryKey: "page",
    },
    {
      codec: stringCodec(),
      defaultValue: "",
      key: "q",
      queryKey: "q",
    },
    {
      codec: csvCodec(),
      defaultValue: [],
      key: "tags",
      queryKey: "tags",
    },
  ],
};

describe("FilterSchema", () => {
  it("parses defaults when URL params are missing", () => {
    const params = new URLSearchParams();

    const filters = parseFilters(SEARCH_FILTER_SCHEMA, (queryKey) => params.get(queryKey));

    expect(filters).toEqual({
      inStock: false,
      page: 1,
      q: "",
      tags: [],
    });
  });

  it("falls back to defaults when URL params are invalid", () => {
    const params = new URLSearchParams("inStock=maybe&page=0&q=%20%20&tags=%2C%2C");

    const filters = parseFilters(SEARCH_FILTER_SCHEMA, (queryKey) => params.get(queryKey));

    expect(filters).toEqual({
      inStock: false,
      page: 1,
      q: "",
      tags: [],
    });
  });

  it("applies patches and normalizes values", () => {
    const current: SearchFilters = {
      inStock: false,
      page: 2,
      q: "table",
      tags: ["new"],
    };

    const next = applyFilterPatch(SEARCH_FILTER_SCHEMA, current, {
      page: -5,
      q: "  desk  ",
    });

    expect(next).toEqual({
      inStock: false,
      page: 1,
      q: "  desk  ",
      tags: ["new"],
    });
  });

  it("omits default values during serialization", () => {
    const params = new URLSearchParams("stale=1");
    const io = createUrlSearchParamsIO(params);

    serializeFilters(
      SEARCH_FILTER_SCHEMA,
      {
        inStock: true,
        page: 1,
        q: "",
        tags: ["featured", "sale"],
      },
      io.setParam,
    );

    expect(params.get("inStock")).toBe("true");
    expect(params.get("page")).toBeNull();
    expect(params.get("q")).toBeNull();
    expect(params.get("tags")).toBe("featured,sale");
    expect(params.get("stale")).toBe("1");
  });

  it("round-trips parsed and serialized values", () => {
    const original: SearchFilters = {
      inStock: true,
      page: 3,
      q: "chairs",
      tags: ["office", "wood"],
    };

    const params = new URLSearchParams();
    const io = createUrlSearchParamsIO(params);
    serializeFilters(SEARCH_FILTER_SCHEMA, original, io.setParam);

    const parsed = parseFilters(SEARCH_FILTER_SCHEMA, io.getParam);
    expect(parsed).toEqual(original);
  });
});
