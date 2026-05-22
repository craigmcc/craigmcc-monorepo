import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { reactBase } from "@repo/vitest-config";
import { defineConfig } from "vitest/config";

const baseTest = ((reactBase as unknown) as { test?: Record<string, unknown> }).test;
const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  ...reactBase,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "src"),
    },
  },
  test: {
    ...(baseTest || {}),
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
