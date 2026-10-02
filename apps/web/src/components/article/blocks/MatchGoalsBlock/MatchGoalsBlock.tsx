/**
 * <MatchGoalsBlock> — the recap-only "Doelpunten." scorer roll-call
 * (5.d-mat lock, Round 2 = V3 sided).
 *
 * Renders after the editorial prose on `matchRecap` articles: a
 * `Doelpunten.` display heading + 2px ink rule, then the goals-only
 * `<MatchEvents filter="goals">` sided rows (home left / away right,
 * central football glyph). KCVV scorers are tinted `jersey-deep` via the
 * `highlightTeam` prop. No cards/subs/lineups/stats — those stay canonical
 * on `/wedstrijd/[matchId]`.
 *
 * Presentational (props-only) so it's Storybook/VR-able; the page server-
 * fetches the match and feeds `events` + `kcvvSide`. Auto-hides when the
 * match has no goal events (a 0-0 recap shows no Doelpunten section).
 */
import { EditorialHeading } from "@/components/design-system";
import { cn } from "@/lib/utils/cn";
import { MatchEvents, type MatchEvent } from "@/components/match/MatchEvents";

export interface MatchGoalsBlockProps {
  homeTeamName: string;
  awayTeamName: string;
  /** Optional PSD shield URLs — surface as the 20px row chips. */
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  events: readonly MatchEvent[];
  /** Side KCVV plays on — tints KCVV scorers jersey-deep. */
  kcvvSide?: "home" | "away";
  className?: string;
}

/**
 * Whether the roll-call renders at all — the block auto-hides without a goal.
 * Exported so the page can tell if something sits between the article body
 * and what follows (#2531).
 */
export function hasGoalEvents(events: readonly MatchEvent[]): boolean {
  return events.some((event) => event.type === "goal");
}

export function MatchGoalsBlock({
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  events,
  kcvvSide,
  className,
}: MatchGoalsBlockProps) {
  // Auto-hide when there are no goals (preview has none; a 0-0 recap none
  // either) — the section only earns its space when there is a roll-call.
  if (!hasGoalEvents(events)) return null;

  return (
    <section
      data-component="match-goals-block"
      className={cn("bg-cream w-full px-4 lg:px-0", className)}
    >
      {/* 30px gap above the section so the roll-call reads as distinct from
          the prose (5.d-mat lock). */}
      <div
        className="mx-auto mt-[30px] w-full"
        style={{ maxWidth: "var(--container-prose)" }}
      >
        <EditorialHeading level={2} size="display-md">
          Doelpunten.
        </EditorialHeading>
        {/* 2px ink rule under the heading. */}
        <div className="border-ink mt-2 mb-2 border-t-2" aria-hidden="true" />
        <MatchEvents
          filter="goals"
          highlightTeam={kcvvSide}
          events={events}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
          homeTeamLogo={homeTeamLogo}
          awayTeamLogo={awayTeamLogo}
        />
      </div>
    </section>
  );
}
