import { reactBase } from "@repo/vitest-config";
import * as path from "node:path";
import { defineConfig } from "vitest/config";

const baseTest = ((reactBase as unknown) as { test?: Record<string, unknown> }).test;
const SHARED_UTILS_FILTERS_ENTRY = path.resolve(
  process.cwd(),
  "../shared-utils/src/filters.ts",
);

export default defineConfig({
  ...reactBase,
  resolve: {
    alias: {
      "@repo/shared-utils/filters": SHARED_UTILS_FILTERS_ENTRY,
    },
  },
  test: {
    ...(baseTest || {}),
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
