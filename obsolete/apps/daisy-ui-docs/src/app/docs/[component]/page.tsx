import { notFound } from "next/navigation";

import { ComponentApiPage } from "@repo/docs-kit";

import { getComponentDoc, getDocIndex } from "@/lib/docs";

export async function generateStaticParams() {
  const index = await getDocIndex();
  return index.map((entry) => ({ component: entry.slug }));
}

export default async function ComponentPage(
  { params }: { params: Promise<{ component: string }> },
) {
  const { component } = await params;
  const meta = await getComponentDoc(component);
  if (!meta) {
    notFound();
  }

  return <ComponentApiPage meta={meta} />;
}
