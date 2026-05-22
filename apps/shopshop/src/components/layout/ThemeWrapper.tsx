"use client"

// @/components/layout/ThemeWrapper.tsx

/**
 * Wrapper (for global layout) the sets the current theme for its children.
 *
 * @packageDocumentation
 */

// External Modules ----------------------------------------------------------

// Internal Modules ----------------------------------------------------------

import { useThemeContext } from "@/contexts/ThemeContext";

// Public Objects ------------------------------------------------------------

export const ThemeWrapper = ({children}: {
  children: React.ReactNode;
}) => {
  const { theme } = useThemeContext();

  return (
    <div data-theme={theme}>
      {children}
    </div>
  );

}
