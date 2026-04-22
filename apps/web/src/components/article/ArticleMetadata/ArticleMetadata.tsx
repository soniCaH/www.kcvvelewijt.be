"use client";

import { Icon } from "@/components/design-system";
import { Facebook, Share2 } from "@/lib/icons";
import { cn } from "@/lib/utils/cn";

export interface ArticleMetadataProps {
  /** Article author name (e.g. "Redactie KCVV"). */
  author: string;
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
  /** Additional CSS classes */
  className?: string;
}

const FACEBOOK_SHARER = "https://www.facebook.com/sharer/sharer.php?u=";

/**
 * Design §7.6 — article metadata bar. Single row with 1px `kcvv-gray-light`
 * rules above and below. Left cluster: date · author · reading time, mono
 * small-caps. Right cluster: share icons (Share2 for the Web Share API,
 * Facebook for direct sharing). No breadcrumb — that role belongs to the
 * "< Terug naar nieuws" back link on the hero and the type-specific kicker.
 *
 * No Twitter/X icon — KCVV has no Twitter/X account (see club-identity memory).
 * Instagram is not a URL-share target either, so the cluster stays at Share2 + Facebook.
 */
export const ArticleMetadata = ({
  author,
  date,
  readingTime,
  shareConfig,
  className,
}: ArticleMetadataProps) => {
  const facts = [date, author, readingTime].filter(
    (x): x is string => typeof x === "string" && x.length > 0,
  );

  // Synchronously branch on Web Share availability so the fallback
  // `window.open` runs inside the user-gesture tick (avoids Chromium's
  // popup-blocker on desktop). `navigator.share`'s promise rejection is
  // treated as a dismissal and NOT a trigger for opening another window —
  // the Facebook `<a>` next to this button is the explicit non-native
  // alternative for users who cancel the native sheet.
  const handleNativeShare = () => {
    if (!shareConfig) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: shareConfig.title ?? author,
          url: shareConfig.url,
        })
        .catch(() => {
          // User dismissed the sheet — leave the click as a no-op. The
          // sibling Facebook link remains available.
        });
      return;
    }
    // Fallback when Web Share API is unavailable (most desktop browsers).
    // Runs in the same click event tick, so the popup is allowed.
    window.open(
      `${FACEBOOK_SHARER}${encodeURIComponent(shareConfig.url)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <nav
      aria-label="Artikelinfo"
      className={cn("border-kcvv-gray-light w-full border-y py-3", className)}
    >
      <div className="max-w-inner-lg mx-auto flex w-full flex-wrap items-center justify-between gap-y-2 px-6">
        <ul className="text-kcvv-gray flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tracking-[var(--letter-spacing-caps)] uppercase">
          {facts.map((fact, i) => (
            <li key={`${i}-${fact}`} className="flex items-center gap-x-3">
              {i > 0 && (
                <span aria-hidden="true" className="text-kcvv-gray-light">
                  ·
                </span>
              )}
              <span>{fact}</span>
            </li>
          ))}
        </ul>

        {shareConfig && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleNativeShare}
              aria-label="Delen"
              className="text-kcvv-gray-blue hover:text-kcvv-green-dark transition-colors"
            >
              <Icon icon={Share2} size="xs" />
            </button>
            <a
              href={`${FACEBOOK_SHARER}${encodeURIComponent(shareConfig.url)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Delen op Facebook"
              className="text-kcvv-gray-blue hover:text-kcvv-green-dark transition-colors"
            >
              <Icon icon={Facebook} size="xs" />
            </a>
          </div>
        )}
      </div>
    </nav>
  );
};
