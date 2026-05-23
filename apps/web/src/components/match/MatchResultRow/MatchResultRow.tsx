import Image from "next/image";
import Link from "next/link";
import { DateTime } from "luxon";
import { cn } from "@/lib/utils/cn";
import { getResultColor } from "@/lib/utils/match-display";
import { MatchStatusBadge } from "../MatchStatusBadge";
import type { ScheduleMatch, ScheduleTeam } from "../types";

export interface MatchResultRowProps {
  match: ScheduleMatch;
  /** When true, the row is decorated as the next upcoming fixture. */
  isNext?: boolean;
  /** Detail-page href; wraps the entire row. */
  href: string;
}

type Result = "win" | "loss" | "draw" | null;

function hasScores(
  match: ScheduleMatch,
): match is ScheduleMatch & { homeScore: number; awayScore: number } {
  return (
    typeof match.homeScore === "number" && typeof match.awayScore === "number"
  );
}

function getResult(match: ScheduleMatch): Result {
  if (!hasScores(match) || match.isHome === undefined) return null;
  return getResultColor(match.homeScore, match.awayScore, match.isHome);
}

interface StubDateParts {
  day: string;
  month: string;
}

function formatStubDate(date: Date): StubDateParts {
  const dt = DateTime.fromJSDate(date).setLocale("nl");
  return {
    day: dt.toFormat("d"),
    // 3-letter Dutch abbreviation, lowercase, period stripped. "juni" → "jun".
    month: dt.toFormat("MMM").replace(/\.$/, "").toLowerCase(),
  };
}

function TeamShield({ team }: { team: ScheduleTeam }) {
  if (team.logo) {
    return (
      <Image
        src={team.logo}
        alt=""
        width={20}
        height={20}
        unoptimized
        className="h-5 w-5 shrink-0 object-contain"
      />
    );
  }
  const initial = team.name.trim().charAt(0).toLocaleUpperCase("nl-BE") || "·";
  return (
    <span
      aria-hidden="true"
      className="border-ink bg-cream-soft text-ink font-display inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] text-[10px] leading-none font-black italic"
    >
      {initial}
    </span>
  );
}

const RESULT_PILL_CLASS: Record<"win" | "loss" | "draw", string> = {
  win: "bg-jersey text-ink",
  draw: "bg-cream-soft text-ink border border-ink",
  // Lock spec was `bg-warm text-cream`; cream-on-warm trips axe at ~2.7:1.
  // Same trade as the MatchStatusBadge STOP override (#1916) — dark text
  // preserves the severity-tier visual signal without the contrast cliff.
  loss: "bg-warm text-ink",
};

const RESULT_PILL_LABEL: Record<"win" | "loss" | "draw", string> = {
  win: "W",
  draw: "G",
  loss: "L",
};

const RESULT_PILL_TITLE: Record<"win" | "loss" | "draw", string> = {
  win: "Winst",
  draw: "Gelijkspel",
  loss: "Verlies",
};

function ResultPill({ result }: { result: "win" | "loss" | "draw" }) {
  return (
    <span
      data-result={result}
      title={RESULT_PILL_TITLE[result]}
      className={cn(
        "inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center font-mono text-[11px] font-bold tracking-[0.04em]",
        RESULT_PILL_CLASS[result],
      )}
    >
      {RESULT_PILL_LABEL[result]}
    </span>
  );
}

/**
 * Finished-match row card for `<TeamSchedule>`. Mini-teaser-row vocabulary
 * locked at 6.B.d7 — a scaled-down `<MatchTeaser>`:
 *
 *   - **Left stub (~64px)** — centred display-big day (18px, weight 900)
 *     over italic display Dutch month abbreviation ("jun"). `bg-cream-soft`,
 *     2px dashed ink right border.
 *   - **Body** — 3-col grid (home `1fr` / score `auto` / away `1fr`) with
 *     italic display team names; the tracked team (`match.isHome`) gets
 *     `font-semibold`. Display-big score 16px / 900.
 *   - **Result pill** — 22×22 square at the row's right edge, separated by
 *     a 1px dashed ink-muted vertical divider. W/G/L per result.
 *
 * Whole row wraps in a `<Link>` with the canonical press-down hover. Light
 * theme only (the sole consumer `<TeamSchedule>` is light).
 */
export function MatchResultRow({
  match,
  isNext = false,
  href,
}: MatchResultRowProps) {
  const isMember = match.isHome !== undefined;
  const isHome = match.isHome ?? false;
  const scored = hasScores(match);
  const homeScore = scored ? match.homeScore : undefined;
  const awayScore = scored ? match.awayScore : undefined;
  const result = getResult(match);
  const stubDate = formatStubDate(match.date);

  // Compose an aria-label that surfaces the outcome to screen readers — the
  // visible W/L/G pill carries the outcome only via `title` (unreliable for
  // SR) + a single letter (cryptic). Append the localised result + score
  // when both are known.
  const ariaLabelParts = [`${match.homeTeam.name} — ${match.awayTeam.name}`];
  if (result && scored) {
    ariaLabelParts.push(
      `${RESULT_PILL_TITLE[result]} ${homeScore}-${awayScore}`,
    );
  }

  return (
    <Link
      href={href}
      data-component="match-result-row"
      aria-label={ariaLabelParts.join(", ")}
      className={cn(
        "border-ink bg-cream shadow-paper-sm relative grid",
        "grid-cols-[64px_1fr_auto] overflow-visible border-2",
        "motion-safe:transition-all motion-safe:duration-300",
        "motion-safe:hover:translate-x-1 motion-safe:hover:translate-y-1 motion-safe:hover:shadow-none",
        isNext && "ring-jersey-deep ring-2 ring-offset-1",
      )}
    >
      {/* ── Stub ──────────────────────────────────────────────────── */}
      <div className="bg-cream-soft text-ink border-ink flex flex-col items-center justify-center gap-1 border-r-2 border-dashed py-3">
        <span className="font-display-big text-[18px] leading-none font-black">
          {stubDate.day}
        </span>
        <span className="font-display text-[10px] leading-none italic opacity-85">
          {stubDate.month}
        </span>
      </div>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-3 md:gap-4 md:px-4">
        {/* Home */}
        <div className="flex min-w-0 items-center gap-2">
          <TeamShield team={match.homeTeam} />
          <span
            title={match.homeTeam.name}
            className={cn(
              "font-display text-ink min-w-0 truncate text-[12.5px] italic",
              isMember && isHome && "font-semibold",
            )}
          >
            {match.homeTeam.name}
          </span>
        </div>

        {/* Score / vs */}
        <div className="flex items-baseline justify-center">
          {homeScore !== undefined && awayScore !== undefined ? (
            <span className="font-display-big text-ink text-[16px] leading-none font-black tabular-nums">
              <span>{homeScore}</span>
              <span className="text-ink-muted mx-1">—</span>
              <span>{awayScore}</span>
            </span>
          ) : (
            <span className="font-display text-ink-muted text-[13px] leading-none lowercase italic">
              vs
            </span>
          )}
        </div>

        {/* Away */}
        <div className="flex min-w-0 flex-row-reverse items-center gap-2">
          <TeamShield team={match.awayTeam} />
          <span
            title={match.awayTeam.name}
            className={cn(
              "font-display text-ink min-w-0 truncate text-right text-[12.5px] italic",
              isMember && !isHome && "font-semibold",
            )}
          >
            {match.awayTeam.name}
          </span>
        </div>
      </div>

      {/* ── Result pill + 1px dashed ink-muted divider ───────────── */}
      <div className="border-ink-muted/60 flex items-center border-l border-dashed px-3">
        {result ? (
          <ResultPill result={result} />
        ) : (
          <span className="inline-block h-[22px] w-[22px]" aria-hidden="true" />
        )}
      </div>

      {/* ── Corner stamp ──────────────────────────────────────────── */
      /* Anchored at -top-5 so the stamp sits mostly ABOVE the row with
         just a hairline kiss against the top border — the row is too
         short (~70px) for the hero/teaser-style deeper overlap, which
         would visibly cover the stub date.
         right-12 (48px) clears the pill cell at the row's right edge
         while keeping the stamp visually anchored to the right column. */}
      <div className="pointer-events-none absolute -top-5 right-12 z-10 rotate-[2deg]">
        <MatchStatusBadge status={match.status} />
      </div>

      {/* ── isNext annotation ─────────────────────────────────────── */
      /* Same -top-5 lift as the corner stamp. Horizontally placed at
         left-12 (48px) so the stamp sits just past the 64px stub edge
         without overshooting the body's home-team slot. */}
      {isNext && (
        <span
          aria-label="Volgende wedstrijd"
          className="bg-jersey-deep text-cream shadow-paper-sm border-ink pointer-events-none absolute -top-5 left-12 z-10 rotate-[-1deg] border-2 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.18em] uppercase"
        >
          Volgende
        </span>
      )}
    </Link>
  );
}
