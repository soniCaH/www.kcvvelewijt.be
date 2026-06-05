"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { EditorialHeading, DashedDivider } from "@/components/design-system";
import { getResultColor, isPlayedMatch } from "@/lib/utils/match-display";
import { EventTypeTag, MatchVenueTag } from "../calendar-tags";
import { trackKalenderItemClick } from "../calendar-analytics";
import {
  buildMonthAgenda,
  formatDayDetailHeading,
  formatItemCount,
  formatEventTime,
  formatMonthNavLabel,
  getMatchDotType,
  type AgendaDayGroup,
  type CalendarMatch,
  type CalendarEvent,
} from "@/app/(main)/kalender/utils";

export interface CalendarAgendaProps {
  matches: CalendarMatch[];
  events: CalendarEvent[];
  currentMonth: number;
  currentYear: number;
}

/** Small crest — club logo when present, else an initialled outline disc. */
function Crest({ name, logo }: { name: string; logo?: string }) {
  if (logo) {
    return (
      <Image
        src={logo}
        alt=""
        width={18}
        height={18}
        unoptimized
        className="h-[18px] w-[18px] shrink-0 object-contain"
      />
    );
  }
  const initial = name.trim().charAt(0).toLocaleUpperCase("nl-BE") || "·";
  return (
    <span
      aria-hidden="true"
      className="border-ink text-ink-muted flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border font-mono text-[8px] font-bold"
    >
      {initial}
    </span>
  );
}

const OUTCOME_UNDERLINE: Record<"win" | "draw" | "loss", string | undefined> = {
  win: "inset 0 -4px 0 var(--color-jersey-deep)",
  draw: undefined,
  loss: "inset 0 -4px 0 var(--color-alert)",
};

/**
 * One match row at list density — reuses the 6.C row vocabulary (crest ·
 * `home — away` · score/time · competition caption · thuis/uit + outcome
 * underline) without the bordered card, so a dense Saturday reads as a clean
 * labelled wall rather than a stack of cards.
 */
function AgendaMatchRow({ match }: { match: CalendarMatch }) {
  const isHome = match.isHome ?? getMatchDotType(match) === "home";
  const when = match.time ?? formatEventTime(match.date) ?? "";
  const isPlayed = isPlayedMatch(match.status);
  const hasScore =
    typeof match.homeScore === "number" && typeof match.awayScore === "number";
  const outcome =
    isPlayed && hasScore
      ? getResultColor(match.homeScore!, match.awayScore!, isHome)
      : null;
  const underline = outcome ? OUTCOME_UNDERLINE[outcome] : undefined;

  return (
    <Link
      href={`/wedstrijd/${match.id}`}
      data-testid="agenda-match-row"
      onClick={() => trackKalenderItemClick("match")}
      className="border-paper-edge hover:bg-cream-soft/50 grid grid-cols-[52px_1fr_auto] items-center gap-3 border-b border-dashed px-2 py-2 no-underline transition-colors last:border-b-0"
    >
      <span className="text-ink-muted font-mono text-[11px]">{when}</span>
      <span className="flex min-w-0 items-center gap-2">
        <Crest name={match.homeTeam.name} logo={match.homeTeam.logo} />
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
            className="font-display text-ink shrink-0 text-[15px] font-black tabular-nums"
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
 * stack (the labelled-wall's one rescue, 6.D lock). Title in italic display +
 * its type tag.
 */
function AgendaEventRow({ event }: { event: CalendarEvent }) {
  const when = formatEventTime(event.dateStart) ?? "";
  return (
    <Link
      href={event.href}
      data-testid="agenda-event-row"
      onClick={() => trackKalenderItemClick(event.source)}
      className="border-paper-edge bg-jersey-deep/6 hover:bg-jersey-deep/12 grid grid-cols-[52px_1fr_auto] items-center gap-3 border-b border-dashed px-2 py-2 no-underline transition-colors last:border-b-0"
    >
      <span className="text-ink-muted font-mono text-[11px]">{when}</span>
      <span className="font-display text-ink min-w-0 truncate text-[15px] font-bold italic">
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
    ...group.matches.map(
      (match): AgendaItem => ({ kind: "match", iso: match.date, match }),
    ),
    ...group.events.map(
      (event): AgendaItem => ({ kind: "event", iso: event.dateStart, event }),
    ),
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
        <p
          role="status"
          className="text-ink-muted py-8 text-center font-mono text-sm"
        >
          Geen wedstrijden of evenementen deze maand.
        </p>
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
