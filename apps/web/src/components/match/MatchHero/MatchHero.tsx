import Image from "next/image";
import { toMatchDisplayZone } from "@/lib/utils/dates";
import { deriveSeason } from "@/lib/utils/season";
import { TapedCard } from "@/components/design-system/TapedCard";
import { cn } from "@/lib/utils/cn";
import { reservationView } from "@/lib/utils/match-display";
import { assertNever } from "@/lib/utils/assert-never";
import type { MatchStatus } from "../types";
import { MatchStatusBadge } from "../MatchStatusBadge";

type MatchHeroKicker = "VOORBESCHOUWING" | "MATCHVERSLAG";

function getKicker(status: MatchStatus): MatchHeroKicker {
  switch (status) {
    case "scheduled":
      return "VOORBESCHOUWING";
    case "finished":
    case "forfeited":
    case "postponed":
    case "cancelled":
    case "stopped":
      return "MATCHVERSLAG";
    default:
      return assertNever(status);
  }
}

export interface MatchHeroTeam {
  id: number;
  name: string;
  logo?: string;
  score?: number;
}

/** Fields every `MatchHeroRow` member carries regardless of `kind`. */
interface MatchHeroCommon {
  date: Date;
  time?: string;
  venue?: string;
  status: MatchStatus;
  competition?: string;
  kcvvTeamLabel?: string;
}

export interface MatchHeroMatch extends MatchHeroCommon {
  /** Discriminant against `MatchHeroReservation`/`MatchHeroReduced`. */
  kind: "match";
  homeTeam: MatchHeroTeam;
  awayTeam: MatchHeroTeam;
}

/**
 * A pitch-reservation placeholder (#2606) — both sides upstream are the same
 * club. `homeTeam`/`awayTeam` do not exist here, mirroring
 * `ScheduleReservation`: a renderer reaching for them without narrowing
 * `kind` first fails to compile (AC 1).
 */
export interface MatchHeroReservation extends MatchHeroCommon {
  /** Discriminant against `MatchHeroMatch`/`MatchHeroReduced`. */
  kind: "reservation";
  /** The club's own crest/name — a self-match has no second side. */
  team: MatchHeroTeam;
}

/**
 * A tournament fixture with no result yet (#2696) — see
 * `ScheduleReducedMatch` for the full rationale. `team` is the *other* club,
 * resolved via club-id equality, never home/away.
 */
export interface MatchHeroReduced extends MatchHeroCommon {
  /** Discriminant against `MatchHeroMatch`/`MatchHeroReservation`. */
  kind: "reduced";
  team: MatchHeroTeam;
}

/**
 * A genuine fixture, a pitch-reservation placeholder, or a tournament
 * fixture with a hidden result — the fourth adapter's output (#2699
 * decision 1 named `CalendarMatch`, `MatchHeroProps` and `MatchDetail` as
 * the three types becoming a union; `CalendarMatch` got its adapter in the
 * same pass this one did not, until now). Built by
 * `matchDetailToHeroRow()` (`/wedstrijd/[matchId]/utils.ts`) so `<MatchHero>`
 * itself never re-derives `kind` from raw fields — the one thing every
 * other renderer of this union already stopped doing.
 */
export type MatchHeroRow =
  MatchHeroMatch | MatchHeroReservation | MatchHeroReduced;

export interface MatchHeroProps {
  match: MatchHeroRow;
  className?: string;
}

interface StubDateParts {
  weekday: string;
  day: string;
  month: string;
}

function formatStubDate(date: Date): StubDateParts {
  const dt = toMatchDisplayZone(date);
  return {
    weekday: dt.toFormat("ccc").replace(/\.$/, "").toUpperCase(),
    day: dt.toFormat("d"),
    month: dt.toFormat("MMM").replace(/\.$/, "").toUpperCase(),
  };
}

function buildCompetitionMeta(
  competition: string | undefined,
  kcvvTeamLabel: string | undefined,
  date: Date,
): string[] {
  const parts: string[] = [];
  if (competition) parts.push(competition);
  if (kcvvTeamLabel) parts.push(kcvvTeamLabel);
  parts.push(deriveSeason(date).label);
  return parts;
}

/**
 * The mono meta line under the header — one `·`-interleaved render, shared
 * by the normal hero's `buildCompetitionMeta` output and the reservation
 * hero's `[subject, kcvvTeamLabel, statusWording]`. Two copies of this loop
 * used to exist, one per hero, with the separator on opposite edges of the
 * `.map()` — same rendered output, two spellings.
 */
function MetaLine({ parts }: { parts: string[] }) {
  return (
    <div className="border-ink border-t pt-3">
      <div className="text-ink font-mono text-[10.5px] tracking-[0.14em] uppercase">
        {parts.map((part, index) => (
          <span key={`${part}-${index}`}>
            {part}
            {index < parts.length - 1 && (
              <span aria-hidden="true" className="text-ink-muted mx-2">
                ·
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function ScoreRegion({
  status,
  homeScore,
  awayScore,
}: {
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
}) {
  switch (status) {
    case "scheduled":
      return (
        <span
          data-score-state="vs"
          className="font-display text-ink-muted text-[22px] leading-none lowercase italic"
        >
          vs
        </span>
      );
    case "finished":
    case "forfeited":
    case "postponed":
    case "cancelled":
    case "stopped": {
      // The scoreline is inside the page's <h1> (#2555), so what it contributes
      // to the accessible name matters. A postponed or scoreless match paints
      // three em dashes, which read as "em dash em dash em dash" — so the
      // placeholders go silent and a hidden "vs" carries the name instead. That
      // is the rule the retired `formatMatchTitle` applied: the score form only
      // when both scores are actually numbers, otherwise "A vs B".
      const hasScores =
        typeof homeScore === "number" && typeof awayScore === "number";
      return (
        <div
          data-score-state="numeric"
          // The scoreline is the SUBJECT of this page (#2516 rule 1), so it
          // keeps its display face and adds no font-variant-numeric class
          // (#2579 supersedes #2610's lining-nums here — see
          // NumberDisplay.tsx for the full measurement this rests on).
          className="font-display-big text-ink flex items-baseline gap-2 text-[34px] leading-none font-black"
        >
          {hasScores ? null : <span className="sr-only">vs</span>}
          <span aria-hidden={!hasScores}>
            {typeof homeScore === "number" ? homeScore : "—"}
          </span>
          <span aria-hidden="true" className="text-ink-muted">
            {"—"}
          </span>
          <span aria-hidden={!hasScores}>
            {typeof awayScore === "number" ? awayScore : "—"}
          </span>
        </div>
      );
    }
    default:
      return assertNever(status);
  }
}

function TeamShieldFallback({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toLocaleUpperCase("nl-BE") || "·";
  return (
    <span
      aria-hidden="true"
      className="border-ink bg-cream-soft text-ink font-display-big inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-[18px] leading-none font-black"
    >
      {initial}
    </span>
  );
}

function TeamSlot({
  team,
  align,
}: {
  team: MatchHeroTeam;
  align: "start" | "end";
}) {
  const isEnd = align === "end";
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3",
        isEnd && "flex-row-reverse text-right",
      )}
    >
      {team.logo ? (
        <Image
          src={team.logo}
          alt=""
          width={40}
          height={40}
          unoptimized
          className="h-10 w-10 shrink-0 object-contain"
        />
      ) : (
        <TeamShieldFallback name={team.name} />
      )}
      <span
        title={team.name.trim() || undefined}
        className="font-display text-ink min-w-0 flex-1 truncate text-[18px] leading-tight italic md:text-[22px]"
      >
        {team.name}
      </span>
    </div>
  );
}

/**
 * The reduced hero for a pitch-reservation placeholder (#2606, #2688) or a
 * tournament fixture with no result yet (#2696/#2802). Same two-zone
 * `<TapedCard>` shell as the normal hero (stub date/time/venue on the left,
 * headline on the right) so it reads as the same page, but the headline
 * names one club — never "vs" a second one — and the meta line carries the
 * competition (`reservationView()`, the same helper `<TeamAgendaRow>`/
 * `<MatchStripView>` use) instead of a competition + squad + season list. No
 * score region, no result vocabulary: neither state has one yet.
 *
 * `reservationView()` is deliberately called with **no** `otherClub` here,
 * unlike the caption-only reduced renderers (`<TeamAgendaRow>`,
 * `<CalendarAgenda>`) — those never print the club's name as its own text
 * node, so folding it into "competition · club" is the only place it
 * appears. Here the `<h1>` already names `match.team` in full; passing
 * `otherClub` through would print the same club twice.
 *
 * The kicker is the other half: a genuine reservation has no preview/report
 * to speak of, so it keeps `reservationView()`'s fixed "GERESERVEERD". A
 * tournament fixture is a real, dated match that merely hasn't confirmed
 * its opponent — it *is* a preview or report, so it keeps `getKicker(status)`
 * like the full hero, rather than also being announced as "GERESERVEERD".
 */
function ReservationHero({
  match,
  className,
}: {
  match: MatchHeroReservation | MatchHeroReduced;
  className?: string;
}) {
  const { team, date, time, venue, status, competition, kcvvTeamLabel } = match;
  const stubDate = formatStubDate(date);
  const {
    subject,
    statusWording,
    kicker: reservationKicker,
  } = reservationView({ status, competition });
  const kicker =
    match.kind === "reservation" ? reservationKicker : getKicker(status);

  return (
    <TapedCard
      as="section"
      bg="cream"
      shadow="md"
      padding="none"
      rotation="none"
      className={cn("relative overflow-visible", className)}
      dataAttrs={{ "data-row-kind": match.kind }}
    >
      <div className="grid grid-cols-1 md:grid-cols-[110px_1fr]">
        {/* ── Stub (left zone) ─────────────────────────────────────── */}
        <div className="bg-cream-soft text-ink flex flex-col gap-3 border-b-2 border-dashed border-[var(--color-ink)] p-5 md:border-r-2 md:border-b-0">
          <div className="flex flex-row items-baseline gap-x-2 leading-none md:flex-col md:items-start md:gap-x-0">
            <div className="font-display-big text-ink text-[20px] leading-none font-black md:text-[24px]">
              {stubDate.weekday} {stubDate.day}
            </div>
            <div className="font-display-big text-ink text-[20px] leading-none font-black md:mt-1 md:text-[24px]">
              {stubDate.month}
            </div>
          </div>

          {time && (
            <div className="text-ink font-mono text-[14px] tracking-[0.06em]">
              {time}
            </div>
          )}

          {venue && (
            <div className="text-ink/75 font-mono text-[9.5px] leading-[1.4] tracking-[0.14em] uppercase">
              {venue}
            </div>
          )}
        </div>

        {/* ── Body (right zone) ────────────────────────────────────── */}
        <div className="flex flex-col gap-5 p-5 md:gap-6 md:p-6">
          <div className="text-ink font-mono text-[10px] tracking-[0.18em] uppercase">
            <span aria-hidden="true">{"∗ "}</span>
            {kicker}
          </div>

          {/* One club, never a "vs" second one — a self-match has no
              opponent to name. `font-normal` for the same reason the normal
              hero's <h1> uses it: the slot inside carries its own weight. */}
          <h1 className="flex items-center gap-3 font-normal">
            <TeamSlot team={team} align="start" />
          </h1>

          {/* The one useful fact a deliberately empty page still owes a
              visitor: which squad reserved the slot. Without it the page
              said only "KCVV Elewijt" and "TORNOOI" and never which team. */}
          <MetaLine
            parts={[subject, kcvvTeamLabel, statusWording?.longForm].filter(
              (part): part is string => Boolean(part),
            )}
          />
        </div>
      </div>

      {/* ── Corner stamp ─────────────────────────────────────────── */}
      <div className="pointer-events-none absolute -top-3 right-4 z-10 rotate-[2deg]">
        <MatchStatusBadge status={status} />
      </div>
    </TapedCard>
  );
}

function FullHero({
  match,
  className,
}: {
  match: MatchHeroMatch;
  className?: string;
}) {
  const {
    homeTeam,
    awayTeam,
    date,
    time,
    venue,
    status,
    competition,
    kcvvTeamLabel,
  } = match;
  const stubDate = formatStubDate(date);
  const kicker = getKicker(status);
  const metaParts = buildCompetitionMeta(competition, kcvvTeamLabel, date);

  return (
    <TapedCard
      as="section"
      bg="cream"
      shadow="md"
      padding="none"
      rotation="none"
      className={cn("relative overflow-visible", className)}
    >
      <div className="grid grid-cols-1 md:grid-cols-[110px_1fr]">
        {/* ── Stub (left zone) ─────────────────────────────────────── */}
        <div className="bg-cream-soft text-ink flex flex-col gap-3 border-b-2 border-dashed border-[var(--color-ink)] p-5 md:border-r-2 md:border-b-0">
          <div className="flex flex-row items-baseline gap-x-2 leading-none md:flex-col md:items-start md:gap-x-0">
            <div className="font-display-big text-ink text-[20px] leading-none font-black md:text-[24px]">
              {stubDate.weekday} {stubDate.day}
            </div>
            <div className="font-display-big text-ink text-[20px] leading-none font-black md:mt-1 md:text-[24px]">
              {stubDate.month}
            </div>
          </div>

          {time && (
            <div className="text-ink font-mono text-[14px] tracking-[0.06em]">
              {time}
            </div>
          )}

          {venue && (
            <div className="text-ink/75 font-mono text-[9.5px] leading-[1.4] tracking-[0.14em] uppercase">
              {venue}
            </div>
          )}
        </div>

        {/* ── Body (right zone) ────────────────────────────────────── */}
        <div className="flex flex-col gap-5 p-5 md:gap-6 md:p-6">
          <div className="text-ink font-mono text-[10px] tracking-[0.18em] uppercase">
            <span aria-hidden="true">{"∗ "}</span>
            {kicker}
          </div>

          {/* The scoreline IS the page's headline, so it owns the <h1> —
              following `<PlayerHero>`'s pattern of wrapping an already-visible
              identity rather than shipping an `sr-only` duplicate beside it
              (#2426 rule 3). The accessible name assembles from the three
              slots: "KCVV Elewijt vs KFC Turnhout" before kickoff,
              "KCVV Elewijt 3 — 1 KFC Turnhout" after it. */}
          {/* `font-normal` because the base `h1` rule is bold and the slots
              inside set their own weight — without it the two club names, which
              carry no explicit weight, would thicken on this one route. */}
          <h1 className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 font-normal md:gap-6">
            <TeamSlot team={homeTeam} align="start" />
            <div className="flex items-center justify-center">
              <ScoreRegion
                status={status}
                homeScore={homeTeam.score}
                awayScore={awayTeam.score}
              />
            </div>
            <TeamSlot team={awayTeam} align="end" />
          </h1>

          <MetaLine parts={metaParts} />
        </div>
      </div>

      {/* ── Corner stamp ─────────────────────────────────────────── */}
      <div className="pointer-events-none absolute -top-3 right-4 z-10 rotate-[2deg]">
        <MatchStatusBadge status={status} />
      </div>
    </TapedCard>
  );
}

/**
 * The match-detail page's hero — state-aware, never auto-hides (#2802
 * review). Dispatches on `match.kind`, already resolved by
 * `matchDetailToHeroRow()`; this component narrows and renders, it never
 * asks `matchRowKind` or `otherClubSide` itself.
 */
export function MatchHero({ match, className }: MatchHeroProps) {
  switch (match.kind) {
    case "reservation":
    case "reduced":
      return <ReservationHero match={match} className={className} />;
    case "match":
      return <FullHero match={match} className={className} />;
    default:
      return assertNever(match);
  }
}
