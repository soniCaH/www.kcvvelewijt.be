import type { RankingEntry } from "@kcvv/api-contract";
import { EditorialHeading, MonoLabelRow } from "@/components/design-system";
import { cn } from "@/lib/utils/cn";
import { StandingsTable } from "@/components/team/StandingsTable";

export interface MatchStandingsSectionProps {
  /** Full league-table rows for the competition. Filtered to the two teams
   * playing this match (a match-day head-to-head snapshot). */
  entries: readonly RankingEntry[];
  /** PSD club id of the home side (`match.home_team.id`). */
  homeClubId: number;
  /** PSD club id of the away side (`match.away_team.id`). */
  awayClubId: number;
  /** PSD team id of the KCVV side, so its row tints in the table. */
  highlightTeamId?: number;
  className?: string;
}

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
 * Auto-hide: returns `null` when neither team is found in the ranking
 * (off-season / empty ranking). The caller mounts this unconditionally; this
 * component owns the "render or not" decision.
 */
export function MatchStandingsSection({
  entries,
  homeClubId,
  awayClubId,
  highlightTeamId,
  className,
}: MatchStandingsSectionProps) {
  // `.filter` returns a fresh array, so the in-place `.sort` never mutates the
  // caller's `entries`.
  const involved = entries
    .filter((e) => e.club_id === homeClubId || e.club_id === awayClubId)
    .sort((a, b) => a.position - b.position);

  if (involved.length === 0) return null;

  return (
    <section
      data-component="match-standings-section"
      className={cn(
        "bg-cream mx-auto w-full max-w-[var(--container-wide)] px-4 py-10 md:py-14",
        className,
      )}
    >
      <MonoLabelRow
        items={[{ label: "KLASSEMENT" }]}
        className="text-ink mb-3"
      />
      <EditorialHeading level={2} size="display-md" className="mb-8 md:mb-10">
        In de stand.
      </EditorialHeading>

      <StandingsTable entries={involved} highlightTeamId={highlightTeamId} />
    </section>
  );
}
