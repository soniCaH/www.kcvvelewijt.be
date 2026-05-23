import Image from "next/image";
import Link from "next/link";
import { DateTime } from "luxon";
import { cn } from "@/lib/utils/cn";
import type { MatchTeaserStatus } from "../types";
import { MatchStatusBadge } from "../MatchStatusBadge";

export interface MatchTeaserTeam {
  /** Team ID — used to determine which side gets the KCVV `font-weight: 600`
   *  emphasis via `highlightTeamId`. */
  id?: string | number;
  name: string;
  /** PSD-sourced shield URL. Optional — falls back to a typographic-initial
   *  chip mirroring `<MatchHero>`. */
  logo?: string;
}

export interface MatchTeaserProps {
  homeTeam: MatchTeaserTeam;
  awayTeam: MatchTeaserTeam;
  /** Match date as ISO string or YYYY-MM-DD. */
  date: string;
  /** Match time as HH:MM. Folded into the body's mono kicker. */
  time?: string;
  /** Venue name. Folded into the body's mono kicker. */
  venue?: string;
  /** Score for finished/forfeited matches. Omit for upcoming. */
  score?: { home: number; away: number };
  status: MatchTeaserStatus;
  /** Wraps the card in a Next.js `<Link>` when set. */
  href?: string;
  /** ID of the team that should render with `font-weight: 600` italic — the
   *  visual cue for "this is the KCVV team". Compared by string equality. */
  highlightTeamId?: string | number;
  /** Optional pre-stub label (e.g. `A-Ploeg`). Rendered as a mono-caps row
   *  above the card to disambiguate when multiple KCVV teams play the same
   *  day (the `<CalendarMonth>` use case). */
  teamLabel?: string;
  isLoading?: boolean;
  className?: string;
}

interface StubDateParts {
  day: string;
  month: string;
}

function formatStubDate(dateStr: string): StubDateParts | null {
  if (!dateStr) return null;
  const dt = DateTime.fromISO(dateStr);
  if (!dt.isValid) return null;
  // Day numeric, month lowercase Dutch ("juni"), no period.
  return {
    day: dt.toFormat("d"),
    month: dt.setLocale("nl").toFormat("MMMM").replace(/\.$/, "").toLowerCase(),
  };
}

function formatKickerWeekday(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  const dt = DateTime.fromISO(dateStr);
  if (!dt.isValid) return undefined;
  // Two-letter weekday abbreviation, uppercased — "ZA" for Saturday.
  return dt.setLocale("nl").toFormat("ccc").replace(/\.$/, "").toUpperCase();
}

function TeamShield({ team }: { team: MatchTeaserTeam }) {
  if (team.logo) {
    return (
      <Image
        src={team.logo}
        alt=""
        width={28}
        height={28}
        unoptimized
        className="h-7 w-7 shrink-0 object-contain"
      />
    );
  }
  const initial = team.name.trim().charAt(0).toLocaleUpperCase("nl-BE") || "·";
  return (
    <span
      aria-hidden="true"
      className="border-ink bg-cream-soft text-ink font-display inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] text-[13px] leading-none font-black italic"
    >
      {initial}
    </span>
  );
}

function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border-ink bg-cream shadow-paper-sm flex h-[88px] border-2",
        className,
      )}
    >
      <div className="bg-cream-soft h-full w-[76px] animate-pulse" />
      <div className="flex-1 p-4">
        <div className="bg-cream-soft mb-3 h-3 w-2/3 animate-pulse" />
        <div className="bg-cream-soft h-4 w-full animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Compact match preview locked at 6.B.d6 (A2-italic). Single card split into
 * two zones by a 2px dashed ink divider:
 *
 *   - **Left stub (~76px)** — centred display-big numeric date + italic
 *     display Dutch month (e.g. `14` / `juni`). `bg-cream-soft`.
 *   - **Right body** — mono caps kicker (weekday · time · venue, no `*`
 *     prefix), then 3-col team/score grid with the KCVV side rendered at
 *     `font-weight: 600` italic display via `highlightTeamId`.
 *
 * Mounts `<MatchStatusBadge>` as a top-right corner stamp; the badge itself
 * owns the render-vs-null decision per 6.B.d5.
 *
 * Hover ships the canonical press-down: shadow flush, +1/+1 translate,
 * 300ms transition. Light theme only.
 */
export function MatchTeaser({
  homeTeam,
  awayTeam,
  date,
  time,
  venue,
  score,
  status,
  href,
  highlightTeamId,
  teamLabel,
  isLoading = false,
  className,
}: MatchTeaserProps) {
  if (isLoading) {
    return <LoadingSkeleton className={className} />;
  }

  const stubDate = formatStubDate(date);
  const weekday = formatKickerWeekday(date);

  const kickerParts = [weekday, time, venue?.toUpperCase()].filter(
    (p): p is string => Boolean(p && p.length),
  );

  const badgeStatus = status === "upcoming" ? "scheduled" : status;
  const hasScore = !!score;

  const isHomeHighlighted =
    highlightTeamId !== undefined &&
    homeTeam.id !== undefined &&
    String(highlightTeamId) === String(homeTeam.id);
  const isAwayHighlighted =
    highlightTeamId !== undefined &&
    awayTeam.id !== undefined &&
    String(highlightTeamId) === String(awayTeam.id);

  const card = (
    <article
      data-component="match-teaser"
      data-status={status}
      className={cn(
        "border-ink bg-cream shadow-paper-sm relative grid",
        "grid-cols-[76px_1fr] overflow-visible border-2",
        href &&
          "motion-safe:transition-all motion-safe:duration-300 " +
            "motion-safe:hover:translate-x-1 motion-safe:hover:translate-y-1 " +
            "motion-safe:hover:shadow-none",
        className,
      )}
    >
      {/* ── Stub ──────────────────────────────────────────────────── */}
      <div className="bg-cream-soft text-ink border-ink flex flex-col items-center justify-center gap-1 border-r-2 border-dashed py-4">
        {stubDate ? (
          <>
            <span className="font-display-big text-[30px] leading-none font-black">
              {stubDate.day}
            </span>
            <span className="font-display text-[14px] leading-none italic">
              {stubDate.month}
            </span>
          </>
        ) : (
          <span className="font-display text-[14px] leading-none italic">
            —
          </span>
        )}
      </div>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 px-4 py-3 md:px-5">
        {kickerParts.length > 0 && (
          <div className="text-ink/60 font-mono text-[10px] tracking-[0.18em] uppercase">
            {kickerParts.map((part, index) => (
              <span key={`${part}-${index}`}>
                {part}
                {index < kickerParts.length - 1 && (
                  <span aria-hidden="true" className="mx-2">
                    ·
                  </span>
                )}
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-4">
          {/* Home — shield left, name left-aligned. */}
          <div className="flex min-w-0 items-center gap-2">
            <TeamShield team={homeTeam} />
            <span
              title={homeTeam.name}
              className={cn(
                "font-display text-ink min-w-0 truncate text-[14px] italic md:text-[15px]",
                isHomeHighlighted && "font-semibold",
              )}
            >
              {homeTeam.name}
            </span>
          </div>

          {/* Score / vs centre. */}
          <div className="flex items-baseline justify-center">
            {hasScore ? (
              <span className="font-display-big text-ink text-[20px] leading-none font-black tabular-nums">
                <span>{score.home}</span>
                <span className="text-ink-muted mx-1.5">—</span>
                <span>{score.away}</span>
              </span>
            ) : (
              <span className="font-display text-ink-muted text-[16px] leading-none lowercase italic">
                vs
              </span>
            )}
          </div>

          {/* Away — shield right, name right-aligned. */}
          <div className="flex min-w-0 flex-row-reverse items-center gap-2">
            <TeamShield team={awayTeam} />
            <span
              title={awayTeam.name}
              className={cn(
                "font-display text-ink min-w-0 truncate text-right text-[14px] italic md:text-[15px]",
                isAwayHighlighted && "font-semibold",
              )}
            >
              {awayTeam.name}
            </span>
          </div>
        </div>
      </div>

      {/* ── Corner stamp ──────────────────────────────────────────── */}
      <div className="pointer-events-none absolute -top-2 right-3 z-10 rotate-[2deg]">
        <MatchStatusBadge status={badgeStatus} />
      </div>
    </article>
  );

  const labelled = teamLabel ? (
    <div data-component="match-teaser-wrap" className="flex flex-col gap-1.5">
      <span className="text-ink-muted font-mono text-[10px] tracking-[0.16em] uppercase">
        {teamLabel}
      </span>
      {card}
    </div>
  ) : (
    card
  );

  return href ? (
    <Link href={href} aria-label={`${homeTeam.name} — ${awayTeam.name}`}>
      {labelled}
    </Link>
  ) : (
    labelled
  );
}
