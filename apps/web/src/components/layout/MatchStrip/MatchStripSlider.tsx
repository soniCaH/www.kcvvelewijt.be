"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** One desktop slide, rendered on the server and handed over as nodes. */
export interface MatchStripSlide {
  /** The slide label (`Uitslag` / `Volgende` / `Vandaag`). */
  label: ReactNode;
  content: ReactNode;
  /** The `Wedstrijddetails` CTA, or `null` for a reduced/reservation slide. */
  cta: ReactNode;
  /** Set for a reservation or a hidden-result tournament fixture. */
  rowKind?: "reservation" | "reduced";
}

/**
 * The desktop strip's result/fixture switch — the only client code in the
 * strip (#3480). Both slides arrive pre-rendered, so the date formatting, the
 * crests and the scoreboard all stay on the server; this holds the one
 * `showResult` toggle and the grid around it.
 */
export function MatchStripSlider({
  result,
  fixture,
  matchDay = false,
}: {
  result: MatchStripSlide | null;
  fixture: MatchStripSlide | null;
  /** The strip's match-day ground (#2616) — see `<MatchStripView>`'s own docblock. */
  matchDay?: boolean;
}) {
  // Default to the result when there is one; otherwise the fixture is the
  // only slide there is. On match day, default to the fixture instead — it
  // is the reason the strip is dark in the first place, and a desktop
  // visitor should not have to click through the switch to discover there is
  // a Match today.
  const [showResult, setShowResult] = useState(result !== null && !matchDay);

  // One source of truth for which slide is showing, so the label, the score and
  // the CTA cannot disagree. Deriving `isResultSlide` from `showResult` alone
  // was wrong when the switch had been moved to the fixture and a later render
  // dropped it: the fallback rendered the result while still labelled
  // "Volgende" and with `vs.` in place of the score.
  const slide =
    showResult && result
      ? { parts: result, isResult: true }
      : fixture
        ? { parts: fixture, isResult: false }
        : result
          ? { parts: result, isResult: true }
          : null;
  if (!slide) return null;

  const { parts, isResult: isResultSlide } = slide;
  const bothSides = result !== null && fixture !== null;

  // The match-day ground's decided tokens (#2616 review).
  const hairline = matchDay ? "border-cream/15" : "border-ink/15";
  const arrowClass = matchDay
    ? "border-cream text-cream hover:bg-cream/10"
    : "border-ink text-ink hover:bg-cream-soft";

  return (
    <div className="hidden lg:grid lg:grid-cols-[auto_1fr_auto]">
      {/* One wrapper for both the switch (`bothSides`) and the label-only
          cases — they differed only in `justify-center gap-2` and the two
          buttons either side of the label (#2616 review). */}
      <div
        className={cn(
          "flex items-center border-r px-5",
          hairline,
          bothSides && "justify-center gap-2",
        )}
      >
        {bothSides && (
          <button
            type="button"
            onClick={() => setShowResult(true)}
            disabled={isResultSlide}
            aria-label="Toon de laatste uitslag"
            className={cn(
              "hit-area flex h-9 w-9 items-center justify-center border-2 font-mono text-sm disabled:opacity-30",
              arrowClass,
            )}
          >
            ←
          </button>
        )}
        <span className={cn(bothSides && "w-20 text-center")}>
          {parts.label}
        </span>
        {bothSides && (
          <button
            type="button"
            onClick={() => setShowResult(false)}
            disabled={!isResultSlide}
            aria-label="Toon de volgende wedstrijd"
            className={cn(
              "hit-area flex h-9 w-9 items-center justify-center border-2 font-mono text-sm disabled:opacity-30",
              arrowClass,
            )}
          >
            →
          </button>
        )}
      </div>

      {/* `aria-live` lives on this always-present cell, not inside either
          slide's content — a live region inserted together with its content is
          not announced (WAI-ARIA), so hanging it on only the normal branch's
          own wrapper meant switching TO a reservation slide (or back) via
          the desktop switch was announced in neither direction. */}
      <div
        aria-live="polite"
        data-row-kind={parts.rowKind}
        className="min-w-0 py-3"
      >
        {parts.content}
      </div>

      {/* An empty cell (no CTA for a reservation or a hidden-result
          tournament fixture) keeps the three-column grid intact. */}
      <div className="flex items-center justify-end px-6">{parts.cta}</div>
    </div>
  );
}
