/**
 * `selectMatchArticle` — picks which linked article the
 * `<MatchArticleLinkCard>` hero features, per the 6.B.d4 cross-state truth
 * table (`docs/design/mockups/phase-6-match-detail/6b4-article-link-card/compare.md`).
 *
 * Rule summary: **recap wins on finished/edge states; preview wins on
 * scheduled.** When the dominant article is missing, fall back to the other
 * rather than hide outright. Both missing → `null` (the card auto-hides).
 *
 * The non-dominant linked article (e.g. the preview that preceded a finished
 * match's recap) is returned as `secondary` so the page can surface it as a
 * small inline "Lees ook …" link beside the card — the agreed replacement for
 * the dropped match-filtered `<RelatedArticles>` slot (a match has at most one
 * "other" linked article, so a full related row would be overkill).
 *
 * Anomalous combinations (a recap linked to a still-upcoming match) render per
 * the fallback rule but emit a `console.warn` — ungated, matching the existing
 * `[wedstrijd/[matchId]]` keeper-lookup warning, so the signal reaches both the
 * `next dev` terminal and Vercel function logs where the bad data actually
 * lives.
 */

import type { MatchStatus } from "@kcvv/api-contract";
import type { MatchArticleVM } from "@/lib/repositories/article.repository";

/** Kicker copy for a recap-featuring card (locked, 6.B.d4). */
export const RECAP_KICKER = "LEES HET VERSLAG · MATCHVERSLAG";
/** Kicker copy for a preview-featuring card (locked, 6.B.d4). */
export const PREVIEW_KICKER = "LEES DE VOORBESCHOUWING · MATCHPREVIEW";

const PREVIEW_SECONDARY_LABEL = "Lees ook de voorbeschouwing";
const RECAP_SECONDARY_LABEL = "Lees ook het verslag";

export interface MatchArticleSecondary {
  /** The non-dominant linked article. */
  article: MatchArticleVM;
  /** Inline link label, e.g. "Lees ook de voorbeschouwing". */
  label: string;
}

export interface MatchArticleSelection {
  /** The article featured in the hero card. */
  article: MatchArticleVM;
  /** Per-state kicker copy for the card's `<MonoLabelRow>`. */
  kicker: string;
  /** The other linked article, for the inline "Lees ook …" link, or null. */
  secondary: MatchArticleSecondary | null;
}

/** Only `scheduled` is upcoming; every other status is finished-or-edge. */
function isUpcoming(status: MatchStatus): boolean {
  return status === "scheduled";
}

function warnAnomaly(reason: string, article: MatchArticleVM): void {
  console.warn(
    `[MatchArticleLinkCard] ${reason} (article: ${article.slug}). ` +
      "Rendering per the fallback rule.",
  );
}

/**
 * Resolve the featured + secondary article for a match's link card.
 *
 * @param articles - Linked `matchPreview` / `matchRecap` articles (0–2 rows,
 *   newest-first) from `ArticleRepository.findByLinkedMatch`.
 * @param status - The match's status, deciding which variant dominates.
 * @returns The selection, or `null` when no usable article exists.
 */
export function selectMatchArticle(
  articles: readonly MatchArticleVM[],
  status: MatchStatus,
): MatchArticleSelection | null {
  const recap = articles.find((a) => a.articleType === "matchRecap");
  const preview = articles.find((a) => a.articleType === "matchPreview");

  if (isUpcoming(status)) {
    // Scheduled → preview dominates.
    if (preview) {
      if (recap) {
        warnAnomaly("a matchRecap is linked to a scheduled match", recap);
        return {
          article: preview,
          kicker: PREVIEW_KICKER,
          secondary: { article: recap, label: RECAP_SECONDARY_LABEL },
        };
      }
      return { article: preview, kicker: PREVIEW_KICKER, secondary: null };
    }
    if (recap) {
      // Preview missing, recap on an upcoming match — anomalous fallback.
      warnAnomaly("only a matchRecap is linked to a scheduled match", recap);
      return { article: recap, kicker: RECAP_KICKER, secondary: null };
    }
    return null;
  }

  // Finished / edge states → recap dominates.
  if (recap) {
    if (preview) {
      return {
        article: recap,
        kicker: RECAP_KICKER,
        secondary: { article: preview, label: PREVIEW_SECONDARY_LABEL },
      };
    }
    return { article: recap, kicker: RECAP_KICKER, secondary: null };
  }
  if (preview) {
    // Recap unwritten, preview still on file — a useful (non-anomalous) fallback.
    return { article: preview, kicker: PREVIEW_KICKER, secondary: null };
  }
  return null;
}
