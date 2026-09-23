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
  /** Share configuration — URL to share. When provided, the Delen button renders. */
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
 * The bar's own mono small-caps register — shared verbatim by the facts
 * cluster and the `Delen` button so the two never drift (the pattern
 * `SiteHeader`'s `CHROME_NAV_TYPE` uses for its own shared row type).
 */
const MONO_SMALL_CAPS =
  "font-mono text-xs tracking-[var(--letter-spacing-caps)] uppercase";

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
    // Fallback when Web Share API is unavailable — Chrome and Firefox on
    // macOS/Linux (owner's decision comment, #2529); Safari on macOS and
    // Edge on Windows already have Web Share and take the branch above.
    // Runs in the same click event tick, so the popup is allowed. Emits
    // the `facebook` channel because the fallback is a Facebook sharer —
    // as of #2529 this means "no Web Share, fell back to the sharer", not
    // "tapped a Facebook-specific icon" (there is no longer one).
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
      className={cn(
        "border-paper-edge w-full border-y",
        // `py-3.5` only when the `Delen` button actually renders — it's
        // container-owned space for THAT button's own `-my-3.5` overhang
        // (see below). Without `shareConfig` there is no overhang to
        // contain, so the bar keeps its original `py-3` — never grow a
        // container's padding for a control that isn't there.
        shareConfig ? "py-3.5" : "py-3",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-[var(--container-wide)] flex-wrap items-center justify-between px-4 md:px-8",
          shareConfig ? "gap-y-3.5" : "gap-y-2",
        )}
      >
        <ul
          className={cn(
            "text-ink-muted flex flex-wrap items-center gap-x-3 gap-y-1",
            MONO_SMALL_CAPS,
          )}
        >
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
          // 44px hit area via `py-3.5` (#2529 — DESIGN.md "The Tap Target
          // Rule"), cancelled from the layout with `-my-3.5` — hit area
          // only, no layout shift, the same idiom `SiteHeader`'s nav links
          // use (`-my-2 py-2`, #2394). Without the cancelling margin the
          // padded box counted toward the row's own flow height, growing
          // the whole bar ~28px (review finding on #3071).
          //
          // The row's `gap-y-3.5` (matching the button's own 14px
          // overhang) and the nav's own `py-3.5` (matching it again) are
          // the container-owned space the cancelled-out hit area is
          // allowed to spill into: 14px of gap above the button's line
          // when the bar wraps, so the invisible hit box reaches the facts
          // line's edge without crossing it, and 14px of the nav's own
          // padding on both sides, so it reaches the nav's own border
          // without crossing into the hero or the article body next to it.
          <button
            type="button"
            onClick={handleNativeShare}
            className={cn(
              "text-ink hover:text-jersey-deep -my-3.5 flex items-center gap-2 py-3.5 transition-colors",
              MONO_SMALL_CAPS,
            )}
          >
            <ShareNetwork size={16} aria-hidden="true" />
            Delen
          </button>
        )}
      </div>
    </nav>
  );
};
