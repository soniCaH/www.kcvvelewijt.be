import type { RankingEntry } from "@kcvv/api-contract";
import {
  EmptyState,
  PageContainer,
  SectionHeader,
} from "@/components/design-system";
import { cn } from "@/lib/utils/cn";
import { StandingsTable } from "@/components/team/StandingsTable";

interface MatchStandingsSectionCommonProps {
  /** PSD club id of the home side (`match.home_team.id`). */
  homeClubId: number;
  /** PSD club id of the away side (`match.away_team.id`). */
  awayClubId: number;
  /** PSD team id of the KCVV side, so its row tints in the table. */
  highlightTeamId?: number;
  className?: string;
}

/** Rows present, or a legitimately empty ranking — the default. */
export interface MatchStandingsSectionAvailableProps extends MatchStandingsSectionCommonProps {
  unavailable?: false;
  /** Full league-table rows for the competition. Filtered to the two teams
   * playing this match (a match-day head-to-head snapshot). */
  entries: readonly RankingEntry[];
}

/**
 * The ranking read failed permanently rather than legitimately returning
 * nothing (#2778 classifies which; the caller passes the verdict through
 * unchanged — this component never infers failure from an empty `entries`
 * array). Renders a failure notice in place of the table instead of
 * auto-hiding (#2576).
 *
 * A required, literal discriminant with no `entries` field at all — not an
 * optional `unavailable?: boolean` beside a populated `entries` — mirroring
 * `ScheduleMatch`/`ScheduleReservation` (`components/match/types.ts`): a
 * caller that has nothing to show has nothing to *construct* either, so
 * "unavailable but entries is populated" is a compile error instead of a
 * silently-dropped notice (#2576 review finding 6).
 */
export interface MatchStandingsSectionUnavailableProps extends MatchStandingsSectionCommonProps {
  unavailable: true;
  entries?: never;
}

export type MatchStandingsSectionProps =
  MatchStandingsSectionAvailableProps | MatchStandingsSectionUnavailableProps;

/**
 * Section wrapper around `<StandingsTable>` for the match-detail page (#2162) —
 * restores the match-day standings snapshot dropped in the #1913 redesign,
 * **league matches only** (the page gates on `competitionType === "league"`).
 *
 * Shows **only the two teams playing this match** — a head-to-head standings
 * snapshot (the legacy behaviour), matched by club id against the full ranking
 * and keeping each team's real league position. Not the whole division.
 *
 * Mirrors the `<MatchLineupSection>` / `<MatchEventsSection>` chrome: mono caps
 * kicker (`KLASSEMENT`) + display-md italic heading (`In de stand.`) + paper
 * container, around the already-redesigned `<StandingsTable>` (KCVV row tinted
 * via `highlightTeamId`).
 *
 * Three outcomes (#2576, resolving the gap #2778 deliberately left open —
 * "no new copy for this state" was that ticket's own call, not this one's):
 * - **Genuinely empty** (`unavailable` false/omitted, `entries` filters to
 *   nobody) — auto-hides, `null`, silently. Off-season, cup/friendly leaked
 *   through, or a youth table with no rows yet. Nothing failed, so nothing
 *   is said.
 * - **Permanently unavailable** (`unavailable: true`) — renders the section's
 *   own kicker + heading (unchanged) with a failure notice in place of the
 *   table: `<EmptyState tier="slot" reason="unavailable">`, #2427's Tier 2
 *   carrying different copy (#2469 resolution rule 5), not a third heading
 *   (rule 1 rejected the "editorial title" candidate for exactly this
 *   double-heading reason on this specific route).
 * - **Rows present** — the table, as before.
 */
export function MatchStandingsSection(props: MatchStandingsSectionProps) {
  const { homeClubId, awayClubId, highlightTeamId, className } = props;

  // `.filter` returns a fresh array, so the in-place `.sort` never mutates the
  // caller's `entries`. The unavailable member carries no `entries` at all —
  // there is nothing to filter, only the notice to render.
  const involved = props.unavailable
    ? []
    : props.entries
        .filter((e) => e.club_id === homeClubId || e.club_id === awayClubId)
        .sort((a, b) => a.position - b.position);

  if (involved.length === 0 && !props.unavailable) return null;

  return (
    <PageContainer
      as="section"
      className={cn("bg-cream py-12 sm:py-16", className)}
    >
      <SectionHeader
        kicker={[{ label: "KLASSEMENT" }]}
        title="In de stand."
        size="display-md"
      />

      {involved.length === 0 ? (
        <EmptyState
          tier="slot"
          reason="unavailable"
          emphasis={{ text: "even niet beschikbaar" }}
        >
          Het klassement is even niet beschikbaar. Probeer het later opnieuw.
        </EmptyState>
      ) : (
        <StandingsTable entries={involved} highlightTeamId={highlightTeamId} />
      )}
    </PageContainer>
  );
}
