import Link from "next/link";

export default function HomePage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold">Daisy UI Docs</h1>
      <p className="mt-2 text-base-content/70">
        Prop-first component docs with machine-readable metadata.
      </p>
      <div className="mt-4">
        <Link className="btn btn-primary" href="/docs">
          Browse Components
        </Link>
      </div>
    </div>
  );
}

