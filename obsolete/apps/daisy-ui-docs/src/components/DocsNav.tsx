import Link from "next/link";

import { getDocIndex } from "@/lib/docs";

export async function DocsNav() {
  const docs = await getDocIndex();

  return (
    <nav className="rounded-box border border-base-300 p-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-base-content/70">
        Components
      </h2>
      <ul className="menu w-full rounded-box bg-base-100">
        {docs.map((entry) => (
          <li key={entry.slug}>
            <Link href={`/docs/${entry.slug}`}>{entry.title}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
