"use client";

import Link from "next/link";
import { useRelatedContent } from "../../hooks/useRelatedContent";
import type { SemanticSearchResult } from "../../hooks/useSemanticSearch";

function getHref(item: SemanticSearchResult): string {
  switch (item.type) {
    case "responsibility":
      return `/hulp?path=${item.slug}`;
    case "article":
      return `/nieuws/${item.slug}`;
    default:
      return `/${item.slug}`;
  }
}

interface RelatedPathsProps {
  sanityId: string;
  limit?: number;
}

export function RelatedPaths({ sanityId, limit }: RelatedPathsProps) {
  const { results, loading } = useRelatedContent(sanityId, limit);

  if (loading || results.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="mb-2 text-sm font-semibold text-[var(--color-text-muted)]">
        Zie ook
      </h4>
      <ul className="space-y-1">
        {results.map((item) => (
          <li key={item.id}>
            <Link
              href={getHref(item)}
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
