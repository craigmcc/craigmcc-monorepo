import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    fileParallelism: false, // Avoid clashes with multiple tests and the database
    globals: true,
    sequence: {
      hooks: "list",
    },
    server: {
      deps: {
        inline: ["next"], // Avoid spurious vitest failures due to next-auth
      },
    },
    // workspace: [
    //   "apps/*",
    //   "packages/*",
    // ],
  },
});
