import Link from "next/link";
import type { ReactNode } from "react";

import { DocsNav } from "@/components/DocsNav";

export function DocsShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <header className="border-b border-base-300 px-4 py-3">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <Link className="text-lg font-semibold" href="/">
            Daisy UI Docs
          </Link>
          <Link className="link link-hover text-sm" href="/docs">
            Components
          </Link>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 p-4 lg:grid-cols-[260px_1fr]">
        <aside>
          <DocsNav />
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}

