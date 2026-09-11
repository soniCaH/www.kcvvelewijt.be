"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  EditorialHeading,
  DashedDivider,
  Crest,
  EmptyState,
} from "@/components/design-system";
import { cn } from "@/lib/utils/cn";
import {
  getResultColor,
  isPlayedMatch,
  isSettledMatch,
  OUTCOME_UNDERLINE,
  reservationView,
} from "@/lib/utils/match-display";
import { pendingEmptyBody } from "@/lib/utils/empty-state-copy";
import { EventTypeTag, MatchVenueTag } from "../calendar-tags";
import { trackKalenderItemClick } from "../calendar-analytics";
import {
  buildMonthAgenda,
  formatDayDetailHeading,
  formatItemCount,
  formatEventTime,
  formatMatchTime,
  formatMonthNavLabel,
  getMatchDotType,
  type AgendaDayGroup,
  type CalendarMatch,
  type CalendarReducedMatch,
  type CalendarReservation,
  type CalendarEvent,
} from "@/app/(main)/kalender/utils";

export interface CalendarAgendaProps {
  matches: CalendarMatch[];
  events: CalendarEvent[];
  currentMonth: number;
  currentYear: number;
}

/**
 * The List Row Fill Rule's keyboard-focus half (DESIGN.md § Motion): a flush
 * list row (no border-2/shadow of its own — the shared dashed hairline is the
 * list's, not the row's) fills on hover rather than pressing down, and
 * `focus-visible` gets that same fill — each call site repeats its own
 * `hover:bg-*` value under `focus-visible:` — plus this inset outline. The
 * fill alone would be too easy to miss against a busy row, and the ring
 * alone is not the literal "same treatment as hover" AC 5 asks for, so
 * `focus-visible` carries both. `-outline-offset-2` draws the ring inside
 * the row, so it can never clip into the row above or below in this
 * borders-touch, gap-free list. `<MatchStripView>`'s own flush row list
 * ships the outline half of this (`focus-visible:outline-2
 * focus-visible:outline-offset-[-2px]`) but not the fill half — its rows
 * predate this rule and were not revisited here.
 */
const LIST_ROW_FOCUS_CLASSES =
  "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-jersey-deep";

/**
 * One match row at list density — reuses the 6.C row vocabulary (crest ·
 * `home — away` · score/time · competition caption · thuis/uit + outcome
 * underline) without the bordered card, so a dense Saturday reads as a clean
 * labelled wall rather than a stack of cards.
 */
/**
 * A pitch-reservation placeholder's reduced agenda row (#2606, #2688) — no
 * opponent, no venue tag, no link (mirrors #2606 decision 5: nothing at
 * `/wedstrijd/{id}` was worth clicking through to from a list row). Same
 * `[52px_1fr_auto]` grid as `AgendaMatchRow` so the two rows still line up in
 * the same day group.
 *
 * Also renders a tournament fixture (#2696/#2715/#2802, `kind === "reduced"`
 * — `competitionType === "tournament"` with no result yet, never a string
 * match on the Dutch `competition` label). The crest and subject then name
 * the **other club**, not KCVV's own — `match.club` is precomputed by
 * `transformMatchToCalendar` via club-id equality, never home/away, since
 * PSD does not say whether the named club hosts or merely shares the
 * bracket. `reservationView(match, otherClub)` composes the "TORNOOI · FC
 * ZEMST SPORTIEF" subject for that case; `undefined` for a placeholder keeps
 * its subject at the competition alone.
 */
function ReservationAgendaRow({
  match,
}: {
  match: CalendarReservation | CalendarReducedMatch;
}) {
  const otherClub = match.kind === "reduced" ? match.club : undefined;
  const { subject } = reservationView(match, otherClub);
  const crestTeam = match.club;
  const when = match.time ?? formatMatchTime(match.date) ?? "";
  return (
    <div
      data-row-kind={match.kind}
      className="border-paper-edge grid grid-cols-[52px_1fr_auto] items-center gap-3 border-b border-dashed px-2 py-2 last:border-b-0"
    >
      <span className="text-ink-muted font-mono text-[11px]">{when}</span>
      <span className="flex min-w-0 items-center gap-2">
        <Crest name={crestTeam.name} logo={crestTeam.logo} size={18} />
        {/* Same squad chip `AgendaMatchRow` renders below — without it a
            reservation among a mixed-squad day's other rows (crest + subject
            + time) cannot be told apart from any other squad's
            reservation. */}
        {match.team && (
          <span className="text-ink-muted shrink-0 font-mono text-[10px] font-semibold tracking-wide">
            {match.team}
          </span>
        )}
        <span className="text-ink-muted min-w-0 truncate font-mono text-[11px] font-semibold tracking-wide uppercase">
          {subject}
        </span>
      </span>
      <span />
    </div>
  );
}

function AgendaMatchRow({ match }: { match: CalendarMatch }) {
  // Enumerated positively (#2802 review), not `kind !== "match"`
  // — a negated catch-all would silently route any future fourth `kind`
  // into the reduced row too, with no compile error.
  if (match.kind === "reservation" || match.kind === "reduced") {
    return <ReservationAgendaRow match={match} />;
  }

  const isHome = match.isHome ?? getMatchDotType(match) === "home";
  const when = match.time ?? formatMatchTime(match.date) ?? "";
  const isPlayed = isPlayedMatch(match.status);
  const hasScore =
    typeof match.homeScore === "number" && typeof match.awayScore === "number";
  // `isSettledMatch`, not `isPlayed` (#2656 review) — `isPlayedMatch` also
  // covers `stopped`, and an abandoned match's partial scoreline is not a
  // result to tint. `<TeamAgendaRow>`'s `computeOutcome` gates the same way
  // ("Settled, not merely finished" / "`stopped` stays out — nothing is
  // settled"); this row rendering both the scoreline (via `isPlayed`, which
  // must still show a stopped match's partial score) and the tint (via
  // `isSettledMatch`) off two different predicates is deliberate, not a
  // second drift the shared `OUTCOME_UNDERLINE` record just closed.
  const outcome =
    isSettledMatch(match.status) && hasScore
      ? getResultColor(match.homeScore!, match.awayScore!, isHome)
      : null;
  // #2656 — reads the shared `<TeamAgendaRow>`/`<MatchStripView>` record
  // (light ground; this row is always on cream) instead of its own drifted
  // local copy, so the outcome colour can't drift between surfaces again.
  // No outcome word is added here (unlike `<TeamAgendaRow>`'s mobile column
  // and `<MatchStripView>`'s mobile ledger): `<MatchVenueTag>` below already
  // assigns the score the way a second club name or a Thuis/Uit tag does
  // elsewhere, so per the placement rule this row stays quiet.
  const underline = outcome ? OUTCOME_UNDERLINE.light[outcome] : undefined;

  return (
    <Link
      href={`/wedstrijd/${match.id}`}
      data-testid="agenda-match-row"
      onClick={() => trackKalenderItemClick("match")}
      className={cn(
        "border-paper-edge grid grid-cols-[52px_1fr_auto] items-center gap-3 border-b border-dashed px-2 py-2 no-underline transition-colors last:border-b-0",
        "hover:bg-cream-soft/50 focus-visible:bg-cream-soft/50",
        LIST_ROW_FOCUS_CLASSES,
      )}
    >
      <span className="text-ink-muted font-mono text-[11px]">{when}</span>
      <span className="flex min-w-0 items-center gap-2">
        <Crest
          name={match.homeTeam.name}
          logo={match.homeTeam.logo}
          size={18}
        />
        {match.team && (
          <span className="text-ink-muted shrink-0 font-mono text-[10px] font-semibold tracking-wide">
            {match.team}
          </span>
        )}
        <span className="text-ink min-w-0 truncate text-[13px] font-semibold">
          {match.homeTeam.name} — {match.awayTeam.name}
        </span>
        {isPlayed && hasScore && (
          <span
            // lining-nums, not tabular-nums (#2610) — the kit's tabular
            // figures are inert.
            className="font-display text-ink shrink-0 text-[15px] font-black lining-nums"
            style={
              underline ? { boxShadow: underline, padding: "0 4px" } : undefined
            }
          >
            {match.homeScore} – {match.awayScore}
          </span>
        )}
        {match.competition && (
          <span className="text-ink-muted hidden shrink-0 font-mono text-[10px] tracking-wide uppercase sm:inline">
            {match.competition}
          </span>
        )}
      </span>
      <MatchVenueTag isHome={isHome} />
    </Link>
  );
}

/**
 * One event row — tinted (jersey-deep wash) so it never gets buried in the match
 * stack (the labelled-wall's one rescue, 6.D lock). Title in body sans +
 * its type tag.
 */
function AgendaEventRow({ event }: { event: CalendarEvent }) {
  const when = formatEventTime(event.dateStart) ?? "";
  return (
    <Link
      href={event.href}
      data-testid="agenda-event-row"
      onClick={() => trackKalenderItemClick(event.source)}
      className={cn(
        "border-paper-edge bg-jersey-deep/6 grid grid-cols-[52px_1fr_auto] items-center gap-3 border-b border-dashed px-2 py-2 no-underline transition-colors last:border-b-0",
        "hover:bg-jersey-deep/12 focus-visible:bg-jersey-deep/12",
        LIST_ROW_FOCUS_CLASSES,
      )}
    >
      <span className="text-ink-muted font-mono text-[11px]">{when}</span>
      <span className="text-ink min-w-0 truncate text-[15px] font-semibold">
        {event.title}
      </span>
      <EventTypeTag eventType={event.eventType} />
    </Link>
  );
}

/** Merge a day's matches + events into one chronological, type-tagged list. */
type AgendaItem =
  | { kind: "match"; iso: string; match: CalendarMatch }
  | { kind: "event"; iso: string; event: CalendarEvent };

function mergeDayItems(group: AgendaDayGroup): AgendaItem[] {
  const items: AgendaItem[] = [
    ...group.matches.map((match): AgendaItem => ({
      kind: "match",
      iso: match.date,
      match,
    })),
    ...group.events.map((event): AgendaItem => ({
      kind: "event",
      iso: event.dateStart,
      event,
    })),
  ];
  return items.sort((a, b) => a.iso.localeCompare(b.iso));
}

function DayGroup({ group }: { group: AgendaDayGroup }) {
  const items = mergeDayItems(group);
  const caption = formatItemCount(group.matches.length, group.events.length);
  const heading = formatDayDetailHeading(group.date);

  return (
    <section aria-label={heading}>
      <div className="flex items-baseline justify-between gap-3 px-2 pt-3 pb-1.5">
        <h3 className="text-ink font-mono text-[11.5px] font-semibold tracking-wider uppercase">
          {heading}
        </h3>
        {caption && (
          <span className="text-ink-muted shrink-0 font-mono text-[10.5px]">
            {caption}
          </span>
        )}
      </div>
      <DashedDivider color="paper-edge" />
      <div>
        {items.map((item) =>
          item.kind === "match" ? (
            <AgendaMatchRow key={`m-${item.match.id}`} match={item.match} />
          ) : (
            <AgendaEventRow key={`e-${item.event.id}`} event={item.event} />
          ),
        )}
      </div>
    </section>
  );
}

/**
 * Agenda view (6.D lock — the "labelled wall"). A month-windowed list: an
 * `<EditorialHeading>` month header, then per-day groups (count sub-header +
 * `<DashedDivider>`) with every item shown — no fold. Events get a tinted row so
 * a dense Saturday never buries them. Shares the navigated month window with the
 * grid views; never the whole season, never a flat upcoming feed.
 */
export function CalendarAgenda({
  matches,
  events,
  currentMonth,
  currentYear,
}: CalendarAgendaProps) {
  const groups = useMemo(
    () => buildMonthAgenda(matches, events, currentYear, currentMonth),
    [matches, events, currentYear, currentMonth],
  );

  const monthLabel = formatMonthNavLabel(currentYear, currentMonth);
  // The italic accent targets the `'YY` suffix of `monthLabel` ("September '26").
  // `EditorialHeading` emphasises the first substring match; month names contain
  // no digits, so the apostrophe-year is always the unique hit.
  const yearPart = `'${String(currentYear).slice(-2)}`;

  return (
    <div data-testid="calendar-agenda">
      <EditorialHeading
        level={2}
        size="display-lg"
        emphasis={{ text: yearPart, tone: "jersey-deep" }}
      >
        {monthLabel}
      </EditorialHeading>
      <div className="border-ink mt-1 mb-2 border-t-2" />

      {groups.length === 0 ? (
        // "Nog geen", not "Geen": a match or event can still be scheduled
        // for the rest of this month (#2427). as="h3": the month heading
        // directly above already opens this section — a second consecutive
        // h2 would be a collision, not a new section (#2562 review).
        <EmptyState
          tier="surface"
          heading="Nog geen wedstrijden of evenementen deze maand"
          as="h3"
          live
        >
          {pendingEmptyBody("er iets wordt ingepland voor deze maand", "het")}
        </EmptyState>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <DayGroup key={group.date} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
