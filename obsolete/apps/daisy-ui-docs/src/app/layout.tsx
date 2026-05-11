import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";
import { DocsShell } from "@/components/DocsShell";

export const metadata: Metadata = {
  title: "Daisy UI Docs",
  description: "API-focused reference docs for @repo/daisy-ui",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <DocsShell>{children}</DocsShell>
      </body>
    </html>
  );
}

