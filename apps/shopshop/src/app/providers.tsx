"use client"

/**
 * Provide context wrappers for use in layout.tsx.
 */

// External Modules ----------------------------------------------------------

import type { ReactNode } from "react";
import { I18nProvider } from "react-aria-components";

// Internal Modules ----------------------------------------------------------

import "@repo/daisy-ui/styles.css";
import { CurrentProfileContextProvider } from "@/contexts/CurrentProfileContext";
import { ThemeContextProvider } from "@/contexts/ThemeContext";

// Public Objects ------------------------------------------------------------

type ProvidersProps = {
  lang: string;
  children: ReactNode;
};

export function Providers({ lang, children }: ProvidersProps) {
  return (
    <CurrentProfileContextProvider>
      <ThemeContextProvider>
        <I18nProvider locale={lang}>
          {children}
        </I18nProvider>
      </ThemeContextProvider>
    </CurrentProfileContextProvider>
  )
}
