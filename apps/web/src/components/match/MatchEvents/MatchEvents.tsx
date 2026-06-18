/**
 * MatchEvents Component
 *
 * Timeline of match events (goals, cards, substitutions).
 *
 * Features:
 * - Chronological timeline display
 * - Event type icons (goal, card, substitution)
 * - Home/Away team distinction
 * - Filter by event type
 * - Group by team option
 */

import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { Swap } from "@/lib/icons.redesign";
import { CardGlyph } from "../CardGlyph";

function assertNever(value: never): never {
  throw new Error(`Unhandled MatchEvent type: ${String(value)}`);
}

/**
 * Free-standing football SVG used as the goal glyph. Cream rind with ink
 * pentagons; ~16px tall. No container — matches the other glyphs (cards
 * via <CardGlyph>, arrows for subs) which all sit unframed in their 22px
 * grid cell. Locked at 6.B.d3 round 2 alongside the card SVGs.
 */
function FootballGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-label="Doelpunt"
      role="img"
    >
      <circle
        cx="8"
        cy="8"
        r="7"
        fill="var(--color-cream)"
        stroke="var(--color-ink)"
        strokeWidth="1"
      />
      {/* Centre pentagon + five around it. */}
      <polygon
        points="8,4.5 10.4,6.2 9.5,9 6.5,9 5.6,6.2"
        fill="var(--color-ink)"
      />
      <polygon points="3.5,7 4.5,5.8 4.8,7.5 3.5,7.8" fill="var(--color-ink)" />
      <polygon
        points="12.5,7 11.5,5.8 11.2,7.5 12.5,7.8"
        fill="var(--color-ink)"
      />
      <polygon points="6.5,12 5,11 4,12.5 6,13" fill="var(--color-ink)" />
      <polygon points="9.5,12 11,11 12,12.5 10,13" fill="var(--color-ink)" />
    </svg>
  );
}

/**
 * 20px team-logo chip rendered at the right edge of each event row. Mirrors
 * the typographic-shield fallback used by `<MatchHero>` when no `logo` URL
 * is supplied — keeps the row identifiable even with missing PSD assets.
 */
function TeamLogoChip({
  name,
  logo,
}: {
  name: string;
  logo: string | undefined;
}) {
  if (logo) {
    return (
      <Image
        src={logo}
        alt={name}
        width={20}
        height={20}
        unoptimized
        className="border-ink h-5 w-5 shrink-0 rounded-full border-[1.5px] object-contain"
      />
    );
  }
  const initial = name.trim().charAt(0).toLocaleUpperCase("nl-BE") || "·";
  return (
    <span
      aria-label={name}
      className="border-ink bg-cream-soft text-ink font-display inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] text-[11px] leading-none font-black italic"
    >
      {initial}
    </span>
  );
}

export interface MatchEvent {
  /** Unique event ID */
  id: number;
  /** Event type */
  type: "goal" | "yellow_card" | "second_yellow" | "red_card" | "substitution";
  /** Minute of the event */
  minute: number;
  /** Additional time (e.g., 90+3) */
  additionalTime?: number;
  /** Team the event belongs to */
  team: "home" | "away";
  /** Player name (for goals and cards) */
  player?: string;
  /** Assist player name (for goals) */
  assist?: string;
  /** Player coming in (for substitutions) */
  playerIn?: string;
  /** Player going out (for substitutions) */
  playerOut?: string;
  /** Is penalty goal */
  isPenalty?: boolean;
  /** Is own goal */
  isOwnGoal?: boolean;
}

export interface MatchEventsProps {
  /** Home team name */
  homeTeamName: string;
  /** Away team name */
  awayTeamName: string;
  /**
   * Home team logo URL (PSD-sourced shield). Optional — falls back to a
   * typographic initial chip when missing, matching `<MatchHero>` behaviour.
   */
  homeTeamLogo?: string;
  /** Away team logo URL. See `homeTeamLogo`. */
  awayTeamLogo?: string;
  /** List of match events */
  events: readonly MatchEvent[];
  /** Filter events by type */
  filter?: "all" | "goals" | "cards" | "substitutions";
  /**
   * Tint the player/scorer names on one side `jersey-deep` instead of the
   * default `text-ink` — used by the article-side Doelpunten block to
   * highlight KCVV scorers (5.d-mat lock, Round 2). Pass the side KCVV
   * plays on (`"home"` | `"away"`). Omit on the match page's full timeline
   * so every name renders in ink.
   */
  highlightTeam?: "home" | "away";
  /** Show event type icons */
  showIcons?: boolean;
  /** Group events by team */
  groupBy?: "chronological" | "team";
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format the minute display
 */
function formatMinute(minute: number, additionalTime?: number): string {
  if (additionalTime) {
    return `${minute}+${additionalTime}'`;
  }
  return `${minute}'`;
}

/**
 * Free-standing event glyph rendered inside the 22px slot of the Option F
 * row grid. Locked at 6.B.d3 round 2:
 *
 *   - goal         → cream football SVG with ink pentagons (variant η)
 *   - yellow_card  → mustard card SVG with ink stroke (variant δ via <CardGlyph>)
 *   - second_yellow → stacked yellow+red card SVG (variant δ via <CardGlyph>)
 *   - red_card     → card-red card SVG with ink stroke (variant δ via <CardGlyph>)
 *   - substitution → two-headed arrow, ink stroke (no container)
 *
 * No background containers — every glyph stands on the paper directly,
 * matching the editorial print register of the surrounding kicker + heading.
 */
function EventGlyph({ type }: { type: MatchEvent["type"] }) {
  switch (type) {
    case "goal":
      return (
        <span className="inline-flex items-center justify-center">
          <FootballGlyph />
        </span>
      );
    case "yellow_card":
      return <CardGlyph type="yellow" size={14} />;
    case "second_yellow":
      return <CardGlyph type="double_yellow" size={14} />;
    case "red_card":
      return <CardGlyph type="red" size={14} />;
    case "substitution":
      return (
        <Swap aria-label="Wissel" className="text-ink h-[18px] w-[18px]" />
      );
    default:
      return assertNever(type);
  }
}

/**
 * Render match events timeline showing goals, cards, and substitutions.
 *
 * @param homeTeamName - Home team name for context
 * @param awayTeamName - Away team name for context
 * @param events - Array of match events
 * @param filter - Filter to specific event types
 * @param showIcons - Whether to show event type icons
 * @param groupBy - How to group events (chronological or by team)
 * @param isLoading - Show loading skeleton
 * @param className - Additional CSS classes
 * @returns The rendered events timeline
 */
export function MatchEvents({
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  events,
  filter = "all",
  highlightTeam,
  showIcons = true,
  groupBy = "chronological",
  isLoading = false,
  className,
}: MatchEventsProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="bg-cream-soft h-6 w-10 animate-pulse" />
            <div className="bg-cream-soft h-[22px] w-[22px] animate-pulse" />
            <div className="bg-cream-soft h-5 flex-1 animate-pulse" />
            <div className="bg-cream-soft h-4 w-12 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  // Filter events
  let filteredEvents = [...events];
  if (filter === "goals") {
    filteredEvents = filteredEvents.filter((e) => e.type === "goal");
  } else if (filter === "cards") {
    filteredEvents = filteredEvents.filter(
      (e) =>
        e.type === "yellow_card" ||
        e.type === "second_yellow" ||
        e.type === "red_card",
    );
  } else if (filter === "substitutions") {
    filteredEvents = filteredEvents.filter((e) => e.type === "substitution");
  }

  // Sort by minute
  filteredEvents.sort((a, b) => {
    const aTime = a.minute + (a.additionalTime || 0) / 100;
    const bTime = b.minute + (b.additionalTime || 0) / 100;
    return aTime - bTime;
  });

  // Empty state
  if (filteredEvents.length === 0) {
    return (
      <div role="status" className={cn("py-8 text-center", className)}>
        <p className="text-ink-muted font-mono text-sm tracking-[0.14em] uppercase">
          Nog geen gebeurtenissen in deze wedstrijd.
        </p>
      </div>
    );
  }

  // Group by team if requested: each column is single-side, so the
  // left/right split idiom from the chronological mode doesn't apply.
  if (groupBy === "team") {
    const homeEvents = filteredEvents.filter((e) => e.team === "home");
    const awayEvents = filteredEvents.filter((e) => e.team === "away");

    return (
      <div className={cn("grid grid-cols-1 gap-8 md:grid-cols-2", className)}>
        <div>
          <h3 className="border-ink text-ink/70 mb-2 border-t pt-2 pb-3 font-mono text-[10px] tracking-[0.16em] uppercase">
            {homeTeamName}
          </h3>
          <EventList
            events={homeEvents}
            showIcons={showIcons}
            highlightTeam={highlightTeam}
          />
        </div>
        <div>
          <h3 className="border-ink text-ink/70 mb-2 border-t pt-2 pb-3 font-mono text-[10px] tracking-[0.16em] uppercase">
            {awayTeamName}
          </h3>
          <EventList
            events={awayEvents}
            showIcons={showIcons}
            highlightTeam={highlightTeam}
          />
        </div>
      </div>
    );
  }

  // Chronological timeline — Option F (locked at 6.B.d3 round 2 by owner
  // feedback on the original short-code spec): left/right split per side
  // with the team logo at the row's right edge.
  //
  //   ┌── 36px ──┬── 22px ──┬── 1fr ───┬── 1fr ───┬── 22px ──┬── 20px ──┐
  //   │  minute  │ L glyph  │ home    │ away    │ R glyph  │   logo   │
  //   └──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
  //
  // Glyph + name appear on the team's side; the opposite side is empty.
  return (
    <ol className={cn("list-none", className)}>
      {filteredEvents.map((event, index) => (
        <li
          key={event.id}
          className={cn(
            index > 0 && "border-cream-deep border-t border-dashed",
          )}
        >
          <EventRow
            event={event}
            showIcon={showIcons}
            highlighted={highlightTeam === event.team}
            teamName={event.team === "home" ? homeTeamName : awayTeamName}
            teamLogo={event.team === "home" ? homeTeamLogo : awayTeamLogo}
          />
        </li>
      ))}
    </ol>
  );
}

/**
 * Per-team event list — used when callers opt into `groupBy="team"`. Each
 * column is single-side, so the row collapses to a simple 3-col layout:
 *
 *   ┌── 36px ──┬── 22px ──┬─── 1fr ──┐
 *   │  minute  │  glyph   │  player  │
 *   └──────────┴──────────┴──────────┘
 */
function EventList({
  events,
  showIcons,
  highlightTeam,
}: {
  events: readonly MatchEvent[];
  showIcons: boolean;
  highlightTeam?: "home" | "away";
}) {
  if (events.length === 0) {
    return (
      <p className="text-ink-muted font-mono text-sm tracking-[0.14em] uppercase">
        Geen gebeurtenissen
      </p>
    );
  }

  return (
    <ol className="list-none">
      {events.map((event, index) => (
        <li
          key={event.id}
          className={cn(
            index > 0 && "border-cream-deep border-t border-dashed",
          )}
        >
          <SingleSideEventRow
            event={event}
            showIcon={showIcons}
            highlighted={highlightTeam === event.team}
          />
        </li>
      ))}
    </ol>
  );
}

/**
 * Chronological-timeline event row — Option F (locked 6.B.d3 round 2).
 * Six columns; the team-specific name + glyph columns render on the event's
 * own side, the opposite side stays empty.
 */
function EventRow({
  event,
  showIcon,
  highlighted,
  teamName,
  teamLogo,
}: {
  event: MatchEvent;
  showIcon: boolean;
  /** When true, the player name renders in `jersey-deep` (KCVV highlight). */
  highlighted: boolean;
  teamName: string;
  teamLogo: string | undefined;
}) {
  const isHome = event.team === "home";
  const nameTint = highlighted ? "text-jersey-deep" : "text-ink";
  return (
    <div className="grid grid-cols-[36px_22px_1fr_1fr_22px_20px] items-center gap-3 py-3 md:gap-4">
      {/* Minute — display-big numeric, tight tracking. */}
      <span className="font-display-big text-ink text-[18px] leading-none font-black tracking-[-0.025em] tabular-nums">
        {formatMinute(event.minute, event.additionalTime)}
      </span>

      {/* Left glyph — only renders for home-side events. */}
      <span className="flex items-center justify-center">
        {showIcon && isHome && <EventGlyph type={event.type} />}
      </span>

      {/* Home name slot — left-aligned italic display. */}
      <span
        className={cn(
          "font-display min-w-0 truncate text-[15px] italic",
          nameTint,
          !isHome && "invisible",
        )}
      >
        {isHome && <EventDescription event={event} />}
      </span>

      {/* Away name slot — right-aligned italic display. */}
      <span
        className={cn(
          "font-display min-w-0 truncate text-right text-[15px] italic",
          nameTint,
          isHome && "invisible",
        )}
      >
        {!isHome && <EventDescription event={event} />}
      </span>

      {/* Right glyph — only renders for away-side events. */}
      <span className="flex items-center justify-center">
        {showIcon && !isHome && <EventGlyph type={event.type} />}
      </span>

      {/* Team logo chip at the row's right edge. */}
      <TeamLogoChip name={teamName} logo={teamLogo} />
    </div>
  );
}

/**
 * Simpler single-side row used by `groupBy="team"`. Each column is already
 * team-specific so the Option F split doesn't apply.
 */
function SingleSideEventRow({
  event,
  showIcon,
  highlighted,
}: {
  event: MatchEvent;
  showIcon: boolean;
  /** When true, the player name renders in `jersey-deep` (KCVV highlight). */
  highlighted: boolean;
}) {
  return (
    <div className="grid grid-cols-[36px_22px_1fr] items-center gap-3 py-3 md:gap-4">
      <span className="font-display-big text-ink text-[18px] leading-none font-black tracking-[-0.025em] tabular-nums">
        {formatMinute(event.minute, event.additionalTime)}
      </span>
      <span className="flex items-center justify-center">
        {showIcon && <EventGlyph type={event.type} />}
      </span>
      <span
        className={cn(
          "font-display min-w-0 truncate text-[15px] italic",
          highlighted ? "text-jersey-deep" : "text-ink",
        )}
      >
        <EventDescription event={event} />
      </span>
    </div>
  );
}

/**
 * Event description text. Variant-aware:
 *  - goal: player + (pen) / (e.d.) / assist embellishments
 *  - card: player only
 *  - substitution: `in ⇆ out` form per lock doc
 */
function EventDescription({ event }: { event: MatchEvent }) {
  switch (event.type) {
    case "goal":
      return (
        <>
          <span>{event.player}</span>
          {event.isPenalty && (
            <span className="text-ink-muted ml-1 text-[12px] not-italic">
              (strafschop)
            </span>
          )}
          {event.isOwnGoal && (
            <span className="text-alert ml-1 text-[12px] not-italic">
              (e.d.)
            </span>
          )}
          {event.assist && (
            <span className="text-ink-muted text-[12px] not-italic">
              {" "}
              (assist: {event.assist})
            </span>
          )}
        </>
      );
    case "yellow_card":
    case "second_yellow":
    case "red_card":
      return <span>{event.player}</span>;
    case "substitution":
      return (
        <>
          <span>{event.playerIn}</span>
          <span aria-hidden="true" className="text-ink-muted mx-1.5 not-italic">
            ⇆
          </span>
          <span>{event.playerOut}</span>
        </>
      );
    default:
      return assertNever(event.type);
  }
}
