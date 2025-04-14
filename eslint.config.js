import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

// prettier-ignore
export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"], plugins: { js }, extends: ["js/recommended"] },
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"], languageOptions: { globals: {...globals.browser, ...globals.node} } },
  { settings: {react: { version: "detect" } } },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  eslintPluginPrettierRecommended,
  {
    ignores: [
      "apps/**/dist/**/*", // Ignore all dist directories in the workspace
      "packages/**/dist/**/*", // Ignore all dist directories in the workspace
    ],
  },
]);
