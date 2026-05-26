---
applyTo: "**/*.{ts,tsx}"
description: "Guidelines for working with TypeScript files in this monorepo."
---

# TypeScript File Guidelines

## Overall File Structure

- Overall file structure should follow this pattern:
  - `"use client";` (if this is a React Client Component)
  - `"use server";` (if this is a Server Action)
  - Brief top-level comment describing the file's purpose and any important context.
  - Section header for External Imports:
  - ```ts
    // External Imports ----------------------------------------------------------
    ```
  - Imports from external dependencies AND from packages in this monorepo ("@repo/foo/bar"), sorted alphabetically by the "from" value.
  - Imports from one app to another app are NOT allowed.  If you need to use code from another app, move that code into a shared package and import it from there.
  - Section header for Internal Imports:
  - ```ts
    // Internal Imports ----------------------------------------------------------
    ```
  - Imports from other files in this app or package, sorted alphabetically by the "from" value.
    - Internal imports should use the "@/" alias, rather than relative paths.
    - Repository TypeScript configs should define `baseUrl` + `paths` for `@/*` so this rule is always applicable.
  - Section header for Public Objects exported by this file:
  - ```ts
    // Public Objects ----------------------------------------------------------
    ```
  - All exports that are part of this file's public API, sorted alphabetically by export name (see exception below for React component properties).
  - Section header for Private Objects used internally in this file:
  - ```ts
    // Private Objects ----------------------------------------------------------
    ```
  - All non-exported objects, sorted alphabetically by name.
  - Note that private objects should be declared after public objects, even if they are used by the public objects. This is to make it easier for readers to find the public API of the file first, without having to scroll past internal implementation details.

## Specifics for React Components

- Declare a *type* for component props. immediately before the component definition.
  - It does not need to be exported, but makes it clear that this is part of the public interface.
  - Name this type {ComponentName}Props (for example, `MenuProps`).
  - Include a one line comment before each field, documenting its meaning.
  - If a field is optional, mark it as such with `?` and add any default value in square brackets at the end of the comment.
  - ```tsx
    export type MenuProps = {
      // Children to be rendered
      children: React.ReactNode;
      // Optional overflow behavior for long menus [auto]
      overflow?: "auto" | "hidden" | "scroll" | "visible";
      // The trigger to open/close this menu
      trigger: React.ReactElement;
      /** The menu's title, shown at the top of the menu. */
      title: string;
    };
    ```
- Declare the component function (as a named export), with the individual props listed (so corresponding variables are initialized).
  - ```tsx
    export function Menu({ children, overflow = "auto", trigger, title }: MenuProps) {
      // component implementation...
    } 
    ```
  - If there are too many props to list on one line, break them into multiple lines with one prop per line, and the opening `{` on the same line as the function declaration.
  - ```tsx
    export function Menu({
      children,
      overflow = "auto",
      trigger,
      title,
    }: MenuProps) {
      // component implementation...
    }
    ```

## General Coding Rules

- Unless required (such as a Next.js route file like `page.tsx`, `layout.tsx`, `template.tsx`, `error.tsx`, `loading.tsx`, or `not-found.tsx`), filenames should be PascalCase (e.g., `Menu.tsx`, not `menu.tsx` or `menu.ts`).
- Unless required (such as for Next.js route files), default exports should not be used.
- Use two spaces for indentation, not tabs or four spaces.
- Follow all the coding rules that will be enforced by the `eslint` linter.
- If exceptions to the linter rules are needed, add a comment before the line in question with `// eslint-disable-next-line {rule-name}` to disable the specific rule for that line, and briefly explain why this is necessary.
- Always use `let` or `const` when defining variables. Never use `var`.
- Unless otherwise required, don't define the variable *type* when it can be inferred from the assigned value.  IDEs will display that deferred value for you.
- Always use `===` and `!==` for comparisons. Never use `==` or `!=`.
- Always end statements with a semicolon (`;`).
- Use double quotes (`"`) for strings, not single quotes (`'`), unless the string contains a double quote that would require escaping.
- Function names and variable names should be in `camelCase`. Type names (including React component prop types and components themselves) should be in `PascalCase`.
- Constants intended as module-level/static constants should be in `UPPER_SNAKE_CASE`.
