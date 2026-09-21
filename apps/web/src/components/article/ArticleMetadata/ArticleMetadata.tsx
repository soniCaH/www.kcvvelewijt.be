"use client";

import { ShareNetwork } from "@/lib/icons.redesign";
import { cn } from "@/lib/utils/cn";
import { useArticleAnalytics } from "@/hooks/useArticleAnalytics";

export interface ArticleMetadataProps {
  /**
   * Article author name (e.g. "Redactie KCVV"). Defaults to the club
   * banner `"KCVV Elewijt"` — every article template renders this implicit
   * club author until an editor-authored byline field lands. Pass
   * explicitly to override (e.g. ghost-written articles).
   */
  author?: string;
  /** Publication date formatted for display (e.g. "19.04.2026"). */
  date?: string;
  /** Reading time, e.g. "4 min lezen". Optional — omitted when empty. */
  readingTime?: string;
  /** Share configuration — URL to share. When provided, Share2 + Facebook icons render. */
  shareConfig?: {
    url: string;
    /** Title used by `navigator.share()`. Falls back to `author` when absent. */
    title?: string;
  };
  /**
   * Sanity document id of the article — hashed before emission. Required to
   * emit `article_share` analytics; when absent, share clicks fire without
   * analytics (used by stories/tests that render ArticleMetadata in isolation).
   */
  articleId?: string;
  /** `articleType` from the article document — used as the `article_type` event param. */
  articleType?: string | null;
  /** Additional CSS classes */
  className?: string;
}

const FACEBOOK_SHARER = "https://www.facebook.com/sharer/sharer.php?u=";

const DEFAULT_AUTHOR = "KCVV Elewijt";

/**
 * Design §7.6 — article metadata bar. Single row with 1px `paper-edge`
 * rules above and below. Left cluster: date · author · reading time, mono
 * small-caps. Right cluster: one labelled "Delen" button (ShareNetwork icon
 * + visible text, same mono small-caps register as the facts cluster) that
 * triggers the Web Share API, or the Facebook sharer fallback where Web
 * Share is unavailable. No breadcrumb — that role belongs to the "< Terug
 * naar nieuws" back link on the hero and the type-specific kicker.
 *
 * No separate Facebook control (#2529 — DESIGN.md "The Tap Target Rule"):
 * `handleNativeShare`'s Facebook-sharer fallback already covers the
 * desktop browsers without Web Share, and a phone's native share sheet
 * already lists Facebook — a second icon-only Facebook link duplicated a
 * path every visitor already has. No Twitter/X icon either — KCVV has no
 * Twitter/X account (see club-identity memory). Instagram is not a
 * URL-share target.
 */
export const ArticleMetadata = ({
  author = DEFAULT_AUTHOR,
  date,
  readingTime,
  shareConfig,
  articleId,
  articleType,
  className,
}: ArticleMetadataProps) => {
  const { trackArticleShare } = useArticleAnalytics();
  const facts = [date, author, readingTime].filter(
    (x): x is string => typeof x === "string" && x.length > 0,
  );

  const trackShare = (channel: "native" | "facebook") => {
    if (!articleId) return;
    trackArticleShare({ articleType, articleId, channel });
  };

  // Synchronously branch on Web Share availability so the fallback
  // `window.open` runs inside the user-gesture tick (avoids Chromium's
  // popup-blocker on desktop). `navigator.share`'s promise rejection is
  // treated as a dismissal and NOT a trigger for opening the Facebook
  // fallback window — the OS share sheet the user just dismissed already
  // offered every channel it supports, Facebook included.
  const handleNativeShare = () => {
    if (!shareConfig) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      trackShare("native");
      navigator
        .share({
          title: shareConfig.title ?? author,
          url: shareConfig.url,
        })
        .catch(() => {
          // User dismissed the sheet — leave the click as a no-op. Ratified
          // silence, one of three: DESIGN.md → "The Silence Is An Answer
          // Rule" (#2470/#2580) — a dismissal is not a failure.
        });
      return;
    }
    // Fallback when Web Share API is unavailable (most desktop browsers).
    // Runs in the same click event tick, so the popup is allowed. Emits
    // the `facebook` channel because the fallback is a Facebook sharer.
    trackShare("facebook");
    window.open(
      `${FACEBOOK_SHARER}${encodeURIComponent(shareConfig.url)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <nav
      aria-label="Artikelinfo"
      className={cn("border-paper-edge w-full border-y py-3", className)}
    >
      <div className="mx-auto flex w-full max-w-[var(--container-wide)] flex-wrap items-center justify-between gap-y-2 px-4 md:px-8">
        <ul className="text-ink-muted flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tracking-[var(--letter-spacing-caps)] uppercase">
          {facts.map((fact, i) => (
            <li key={`${i}-${fact}`} className="flex items-center gap-x-3">
              {i > 0 && (
                <span aria-hidden="true" className="text-paper-edge">
                  ·
                </span>
              )}
              <span>{fact}</span>
            </li>
          ))}
        </ul>

        {shareConfig && (
          // `py-3.5` is the hit area, not a negative-margin trick (#2529 —
          // DESIGN.md "The Tap Target Rule"): the 16px icon/text-xs row
          // plus 14px top/bottom padding totals the 44px minimum, and the
          // padded box (not just its visible content) is what the row's
          // own `gap-y-2` separates from the facts line above when this
          // bar wraps on a phone — a negative margin would reach back
          // into that gap instead of respecting it.
          <button
            type="button"
            onClick={handleNativeShare}
            className="text-ink-soft hover:text-jersey-deep flex items-center gap-2 py-3.5 font-mono text-xs tracking-[var(--letter-spacing-caps)] uppercase transition-colors"
          >
            <ShareNetwork size={16} aria-hidden="true" />
            Delen
          </button>
        )}
      </div>
    </nav>
  );
};
