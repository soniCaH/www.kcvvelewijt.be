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
import { EmptyState } from "@/components/design-system";
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
 *
 * Both branches are silent (#2559 rule 3 + 4): the crest and the monogram are
 * two fills of one slot, so they get one verdict, and the scorer's team is
 * named in the row either way. `data-team` carries the name for tests and
 * styling — it is inert to assistive tech, which is the point.
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
        alt=""
        data-team={name}
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
      aria-hidden="true"
      data-team={name}
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
            <div className="bg-cream-soft h-6 w-10 motion-safe:animate-pulse" />
            <div className="bg-cream-soft h-[22px] w-[22px] motion-safe:animate-pulse" />
            <div className="bg-cream-soft h-5 flex-1 motion-safe:animate-pulse" />
            <div className="bg-cream-soft h-4 w-12 motion-safe:animate-pulse" />
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

  // No tier-"surface" branch for the whole-timeline-empty case: both
  // production callers (`MatchEventsSection`, which renders `<MatchEvents
  // events={events} />` with the default `filter="all"`, and
  // `MatchGoalsBlock`, which renders `<MatchEvents filter="goals">`) already
  // guard their own "does this section earn its space" decision before
  // mounting this component, so `filteredEvents.length === 0` is
  // unreachable here. When both sides of a `groupBy="team"` render are
  // empty, each side's own tier-"slot" box (below) covers it (#2562 review
  // round 3 — see MatchEvents.test.tsx for the two guard sites this leans on).

  // Group by team if requested: each column is single-side, so the
  // left/right split idiom from the chronological mode doesn't apply.
  if (groupBy === "team") {
    const homeEvents = filteredEvents.filter((e) => e.team === "home");
    const awayEvents = filteredEvents.filter((e) => e.team === "away");

    return (
      <div className={cn("grid grid-cols-1 gap-8 md:grid-cols-2", className)}>
        {/* `flex flex-col` on each column so an empty side's tier-"slot" box
            can grow (`flex-1`) to fill the grid row's stretched height
            instead of collapsing to one line beside a full column
            (#2562 review). */}
        <div className="flex flex-col">
          <h3 className="border-ink text-ink/70 mb-2 border-t pt-2 pb-3 font-mono text-[10px] tracking-[0.16em] uppercase">
            {homeTeamName}
          </h3>
          <EventList
            events={homeEvents}
            showIcons={showIcons}
            highlightTeam={highlightTeam}
          />
        </div>
        <div className="flex flex-col">
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
    // Tier "slot" (#2427 / #2562): one team's column is empty while the
    // other side of the grouped view is full. Fills the rest of the
    // stretched column by default (`flex-1`).
    return <EmptyState tier="slot">Geen gebeurtenissen</EmptyState>;
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
    <div className="grid grid-cols-[56px_22px_1fr_1fr_22px_20px] items-center gap-3 py-3 md:gap-4">
      {/* Minute — a TAG beside a scorer (#2516 rule 1), not the surface's
          subject, so it moves to mono: alignment and figure shape come from
          the face, not a class (#2579 supersedes #2610's lining-nums).
          The first track widened 36px -> 56px (#2579 review) — measured on
          the served kit, IBM Plex Mono at 18px/900 renders a stoppage-time
          minute ("45+2'") at ~52px, which the old 36px track (sized for the
          narrower Freight Big glyphs it replaced) clipped into the icon
          column next to it. font-bold, not font-black: IBM Plex Mono
          self-hosts only 400/500/600/700 (app/layout.tsx), so a requested
          900 was already clamping to 700. */}
      <span className="text-ink font-mono text-[18px] leading-none font-bold tracking-[-0.025em]">
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

      {/* The row names the scoring team (#2559 rule 1). Sighted readers get
          this from which of the two name columns is filled — a purely visual
          signal, and this row's ONLY carrier of it once the chip below went
          silent. Without this the row reads "12' Jan Janssens" with no side.
          `SingleSideEventRow` needs no equivalent: its whole column is one
          team, announced by the heading above it. */}
      <span className="sr-only">{teamName}</span>

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
    <div className="grid grid-cols-[56px_22px_1fr] items-center gap-3 py-3 md:gap-4">
      {/* Minute — a TAG beside a scorer (#2516 rule 1); mono, same as the
          two-sided row's minute above (#2579 supersedes #2610's
          lining-nums). First track widened 36px -> 56px (#2579 review) —
          see EventRow's identical note above. */}
      <span className="text-ink font-mono text-[18px] leading-none font-bold tracking-[-0.025em]">
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
