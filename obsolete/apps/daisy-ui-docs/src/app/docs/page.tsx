import Link from "next/link";

import { getDocIndex } from "@/lib/docs";

export default async function DocsIndexPage() {
  const docs = await getDocIndex();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Component Reference</h1>
      <p className="text-base-content/70">
        Stable prop contracts for developers and tooling.
      </p>
      <div className="grid gap-3">
        {docs.map((entry) => (
          <article className="card border border-base-300 bg-base-100" key={entry.slug}>
            <div className="card-body">
              <h2 className="card-title">{entry.title}</h2>
              <p>{entry.description}</p>
              <div className="card-actions justify-end">
                <Link className="btn btn-sm btn-primary" href={`/docs/${entry.slug}`}>
                  View API
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
