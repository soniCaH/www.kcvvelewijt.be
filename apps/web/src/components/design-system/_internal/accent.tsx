/**
 * Shared "accented substring" mechanism — one split function, one tone map,
 * one `<em>` renderer, used by `<EditorialHeading>`'s `emphasis={{ text,
 * tone }}` (the string-emphasis and Portable-Text-`accent`-span paths) and
 * `<EmptyState>` tier "slot"'s `reason: "unavailable"` failure notice
 * (#2469/#2576/#2690).
 *
 * Extracted rather than left as two hand-copies (#2576 review finding 8):
 * before this, `EmptyState.tsx` carried a verbatim copy of
 * `EditorialHeading.tsx`'s own (then-unexported) `splitOnEmphasis` plus a
 * second `ACCENT_TONE_CLASS` map minus the `warm` entry. #2469 rule 2 locks
 * the accent as jersey-deep on cream / warm on dark for both call sites —
 * one tone map keeps `<EditorialHeading>`'s own dark-ground `warm` accent in
 * sync with `<EmptyState>`'s cream-only jersey-deep accent without a second
 * copy to drift. No dark axis is planned for `<EmptyState>` itself (#3103);
 * reopen only if a dark consumer appears off the homepage.
 *
 * Deliberately minimal: this is the plain accent only — `<em
 * className="font-display italic {tone}">`. `<EditorialHeading>`'s
 * `HighlighterStroke` (marker) variant and its Portable Text block-parsing
 * stay local to that component; neither is shared, since `<EmptyState>`
 * never needs them and a highlighter sweep is this site's *celebratory*
 * register — wrong on a failure notice (#2469 rule 2).
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** `"jersey-deep"` (default) — readable on cream/paper. `"warm"` — readable
 *  on jersey-deep/ink (dark-ground) surfaces. */
export type AccentTone = "jersey-deep" | "warm";

const ACCENT_TONE_CLASS: Record<AccentTone, string> = {
  "jersey-deep": "text-jersey-deep",
  warm: "text-warm",
};

/**
 * Split `text` on the first occurrence of `accentText`. Returns `null` when
 * `accentText` is empty or not found — the caller decides whether/how to
 * warn (each of today's two callers has a different dev-warning shape).
 */
export function splitOnAccent(
  text: string,
  accentText: string,
): { before: string; match: string; after: string } | null {
  if (!accentText) return null;
  const idx = text.indexOf(accentText);
  if (idx < 0) return null;
  return {
    before: text.slice(0, idx),
    match: text.slice(idx, idx + accentText.length),
    after: text.slice(idx + accentText.length),
  };
}

/** The accented `<em>` itself: `font-display italic` + the tone's colour. */
export function AccentEm({
  tone = "jersey-deep",
  children,
}: {
  tone?: AccentTone;
  children: ReactNode;
}) {
  return (
    <em className={cn("font-display italic", ACCENT_TONE_CLASS[tone])}>
      {children}
    </em>
  );
}
