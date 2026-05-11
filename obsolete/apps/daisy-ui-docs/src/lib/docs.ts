import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { ComponentMeta } from "@repo/docs-schema";
import { parseComponentMeta } from "@repo/docs-schema";

type DocIndexEntry = {
  slug: string;
  title: string;
  description: string;
};

let docsCache: Promise<Record<string, ComponentMeta>> | null = null;

function toPlainTextExcerpt(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/[*_~]/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadDocsBySlug(): Promise<Record<string, ComponentMeta>> {
  if (docsCache) {
    return docsCache;
  }

  docsCache = (async () => {
    const metaDir = path.join(process.cwd(), "src/content/meta");
    const files = (await fs.readdir(metaDir)).filter((entry) => entry.endsWith(".json"));

    const entries = await Promise.all(
      files.map(async (fileName) => {
        const slug = fileName.replace(/\.json$/, "").toLowerCase();
        const filePath = path.join(metaDir, fileName);
        const raw = await fs.readFile(filePath, "utf8");
        const meta = parseComponentMeta(JSON.parse(raw));
        return [slug, meta] as const;
      }),
    );

    return Object.fromEntries(entries);
  })();

  return docsCache;
}

export async function getDocIndex(): Promise<DocIndexEntry[]> {
  const docsBySlug = await loadDocsBySlug();
  return Object.entries(docsBySlug)
    .map(([slug, meta]) => ({
      slug,
      title: meta.component,
      description: toPlainTextExcerpt(meta.description),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function getComponentDoc(slug: string): Promise<ComponentMeta | null> {
  const docsBySlug = await loadDocsBySlug();
  return docsBySlug[slug] ?? null;
}
