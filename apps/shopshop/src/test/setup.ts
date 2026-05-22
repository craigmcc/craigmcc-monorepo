// Registers @testing-library/jest-dom custom matchers with Vitest's expect.
// This file is included in the TypeScript compilation via tsconfig.json's
// "**/*.ts" glob so that IDE type checking resolves toHaveClass,
// toBeInTheDocument, etc. without errors.
import "@testing-library/jest-dom/vitest";


