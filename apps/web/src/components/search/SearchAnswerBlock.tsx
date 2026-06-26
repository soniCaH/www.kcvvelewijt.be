"use client";

/**
 * SearchAnswerBlock — the `/zoeken` semantic augment lane (8s5 / ZOEK-3).
 *
 * Sits ABOVE the unchanged lexical search. Driven by the existing
 * `useSemanticSearch` hook (`POST /api/search`, all content types, limit 5),
 * triggered by the COMMITTED query (submit / URL `?q=`), not per keystroke.
 *
 * Score gate (the result carries `score`; `answer` only arrives ≥ 0.5):
 *  - top ≥ 0.5 + answer → <SearchAnswerCard> (variant C prose card)
 *  - 0.35 ≤ top < 0.5   → "Gerelateerd" rows (title + excerpt + link, no prose)
 *  - top < 0.35         → nothing (lexical only)
 *
 * Graceful fallback (PRD floor): a POST error / 503 settles with empty results,
 * so the block renders nothing — lexical search is never affected, no "AI" hint.
 * The `executedQuery` gate avoids an empty-state flash while a fetch is in
 * flight: we only act on results once they've settled for the current query.
 */

import { useEffect } from "react";
import Link from "next/link";
import {
  useSemanticSearch,
  type SemanticSearchResult,
} from "@/hooks/useSemanticSearch";
import { SearchAnswerCard } from "./SearchAnswerCard";

const PROSE_MIN_SCORE = 0.5;
const RELATED_MIN_SCORE = 0.35;

const RELATED_TYPE_LABEL: Record<SemanticSearchResult["type"], string> = {
  article: "Nieuws",
  page: "Pagina",
  responsibility: "Hulp",
};

/**
 * Derive a destination URL from a semantic hit's type + slug. Mirrors the
 * `<HubSearch>` conventions: articles → /nieuws, pages → /club, responsibilities
 * deep-link the `/hulp` finder by slug (which equals the path id it reveals by).
 */
export function semanticResultUrl(result: SemanticSearchResult): string {
  switch (result.type) {
    case "article":
      return `/nieuws/${result.slug}`;
    case "page":
      return `/club/${result.slug}`;
    case "responsibility":
      return `/hulp#${result.slug}`;
  }
}

export interface SearchAnswerBlockProps {
  /** The committed search query (changes on submit / URL `?q=`, not per keystroke). */
  query: string;
}

export function SearchAnswerBlock({ query }: SearchAnswerBlockProps) {
  const { results, answer, executedQuery, search } = useSemanticSearch({
    limit: 5,
  });
  const trimmed = query.trim();

  useEffect(() => {
    search(trimmed);
  }, [trimmed, search]);

  // Only act on results that have SETTLED for the current query — no empty-state
  // flash mid-flight, and an errored/empty settle simply renders nothing.
  if (executedQuery !== trimmed || trimmed.length < 2) return null;

  const top = results[0];
  if (!top || top.score < RELATED_MIN_SCORE) return null;

  // High confidence + an LLM answer → the variant C prose card.
  if (top.score >= PROSE_MIN_SCORE && answer) {
    return (
      <SearchAnswerCard
        answer={answer}
        sources={results.map((result) => ({
          title: result.title,
          href: semanticResultUrl(result),
        }))}
      />
    );
  }

  // Low confidence (0.35–0.5) → "Gerelateerd" rows, no prose.
  // ponytail: inline list — a ~12-line styled list, not worth its own file.
  return (
    <section className="border-paper-edge bg-cream-soft border">
      <h2 className="text-ink-muted border-paper-edge border-b px-3 py-2 font-mono text-[10px] font-semibold tracking-[0.1em] uppercase">
        Gerelateerd
      </h2>
      <ul>
        {results.map((result) => (
          <li key={`${result.type}-${result.id}`}>
            <Link
              href={semanticResultUrl(result)}
              className="border-paper-edge text-ink hover:bg-cream focus-visible:outline-jersey-deep block border-b px-3 py-2.5 outline-none last:border-b-0 focus-visible:outline-2 focus-visible:-outline-offset-2"
            >
              <span className="text-jersey-deep font-mono text-[9px] tracking-[0.06em] uppercase">
                {RELATED_TYPE_LABEL[result.type]}
              </span>
              <span className="mt-0.5 block text-[13px] font-semibold">
                {result.title}
              </span>
              {result.excerpt && (
                <span className="text-ink-muted mt-0.5 line-clamp-1 block text-[11.5px]">
                  {result.excerpt}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
