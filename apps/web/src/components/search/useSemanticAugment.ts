"use client";

/**
 * useSemanticAugment — the `/zoeken` semantic augment state (8s5 / ZOEK-3).
 *
 * Wraps the existing `useSemanticSearch` hook (`POST /api/search`, all content
 * types, limit 5) and resolves it into ONE discriminated state so the page can
 * render the two semantic surfaces in their correct positions from a single
 * fetch:
 *  - `answer`  → the `✦ Slim antwoord` prose card, ABOVE the lexical results
 *  - `related` → low-confidence "Gerelateerd" links, BELOW the lexical results
 *  - `none`    → nothing (lexical only), settled with nothing worth showing
 *  - `pending` → still waiting on the debounce + fetch for the current query
 *
 * Score gate (the result carries `score`; `answer` only arrives ≥ 0.5):
 *  - top ≥ 0.5 + answer → `answer`
 *  - 0.35 ≤ top < 0.5   → `related`
 *  - top < 0.35         → `none`
 *
 * De-dup: results whose derived URL already appears in the lexical results
 * (`excludeUrls`) are dropped, so the same article never shows twice. Only
 * articles can overlap — pages/responsibilities are never in lexical search.
 *
 * Triggered by the COMMITTED query (submit / URL `?q=`), not per keystroke.
 * `executedQuery` is the settlement gate: `useSemanticSearch` only updates it
 * once a fetch resolves, and does so on BOTH success and failure (see its own
 * `catch` block), so `executedQuery === trimmed` means "settled" regardless
 * of outcome — there is no separate "failed" state to account for here. Below
 * that gate, `trimmed !== executedQuery` is reported as `pending`, not `none`
 * — the two used to be conflated, which is exactly what let a lexical failure
 * fire `search_failed`/render its notice off a semantic answer that simply
 * hadn't arrived yet (#2824 review; the semantic POST debounces 300ms before
 * it even starts, so in the real request order the lexical GET almost always
 * settles first). A POST error / 503 still settles to `none` (empty results),
 * so lexical search is never blocked — `/api/search`'s POST proxy itself caps
 * the semantic fetch at 15s (`AbortSignal.timeout(15_000)`,
 * `app/api/search/route.ts`), so `pending` cannot last unbounded either.
 *
 * Ratified silence, one of four: DESIGN.md → "The Silence Is An Answer
 * Rule" (#2470/#2580) — the lexical results below still serve, so this
 * augment's own failure recovers nothing worth telling the visitor about.
 * `error` is deliberately not destructured from `useSemanticSearch` below —
 * there is no failure notice to wire it into.
 */

import { useEffect } from "react";
import {
  useSemanticSearch,
  type SemanticSearchResult,
} from "@/hooks/useSemanticSearch";
import type { SearchAnswerSource } from "./SearchAnswerCard";

const PROSE_MIN_SCORE = 0.5;
const RELATED_MIN_SCORE = 0.35;

export interface SemanticRelatedItem {
  type: SemanticSearchResult["type"];
  title: string;
  excerpt: string;
  href: string;
}

export type SemanticAugment =
  | { kind: "answer"; answer: string; sources: SearchAnswerSource[] }
  | { kind: "related"; items: SemanticRelatedItem[] }
  | { kind: "none" }
  | { kind: "pending" };

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

/**
 * @param query - the committed search query (changes on submit / URL `?q=`).
 * @param excludeUrls - URLs already shown in the lexical results (for de-dup).
 */
export function useSemanticAugment(
  query: string,
  excludeUrls: ReadonlySet<string>,
): SemanticAugment {
  const { results, answer, executedQuery, search } = useSemanticSearch({
    limit: 5,
  });
  const trimmed = query.trim();

  useEffect(() => {
    search(trimmed);
  }, [trimmed, search]);

  // Below the 2-char floor there is no augment fetch to wait on at all — the
  // search is empty, not merely unsettled.
  if (trimmed.length < 2) return { kind: "none" };

  // Still waiting on the debounce + fetch for THIS query. Distinct from
  // `none` (see docblock) — a caller that needs to know whether an answer
  // will suppress something of its own (`SearchInterface`, #2824) must wait
  // for this to clear before treating "no answer yet" as "no answer".
  if (executedQuery !== trimmed) return { kind: "pending" };

  // Gate on the genuine top score (BEFORE de-dup) — using `!(x >= n)` so a
  // missing / NaN score is treated as below-threshold rather than slipping
  // through (`undefined < 0.35` is `false`).
  const top = results[0];
  if (!top || !(top.score >= RELATED_MIN_SCORE)) return { kind: "none" };

  const deduped = results.filter(
    (result) => !excludeUrls.has(semanticResultUrl(result)),
  );

  // High confidence + an LLM answer → the prose card (sources de-duped).
  if (top.score >= PROSE_MIN_SCORE && answer) {
    return {
      kind: "answer",
      answer,
      sources: deduped.map((result) => ({
        title: result.title,
        href: semanticResultUrl(result),
      })),
    };
  }

  // Low confidence → "Gerelateerd" links. Nothing left after de-dup → none.
  if (deduped.length === 0) return { kind: "none" };
  return {
    kind: "related",
    items: deduped.map((result) => ({
      type: result.type,
      title: result.title,
      excerpt: result.excerpt,
      href: semanticResultUrl(result),
    })),
  };
}
