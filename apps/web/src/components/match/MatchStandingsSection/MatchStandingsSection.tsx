import type { RankingEntry } from "@kcvv/api-contract";
import { EditorialHeading, MonoLabelRow } from "@/components/design-system";
import { cn } from "@/lib/utils/cn";
import { StandingsTable } from "@/components/team/StandingsTable";

export interface MatchStandingsSectionProps {
  /** League-table rows for the KCVV team's competition. */
  entries: readonly RankingEntry[];
  /** PSD team id of the KCVV side, so its row tints in the table. */
  highlightTeamId?: number;
  className?: string;
}

/**
 * Section wrapper around `<StandingsTable>` for the match-detail page (#2162) —
 * restores the match-day standings snapshot dropped in the #1913 redesign,
 * **league matches only** (the page gates on `competitionType === "league"`).
 *
 * Mirrors the `<MatchLineupSection>` / `<MatchEventsSection>` chrome: mono caps
 * kicker (`KLASSEMENT`) + display-md italic heading (`In de stand.`) + paper
 * container, around the already-redesigned `<StandingsTable>` (KCVV row tinted
 * via `highlightTeamId`).
 *
 * Auto-hide: returns `null` when there are no entries (off-season / empty
 * ranking). The caller mounts this unconditionally; this component owns the
 * "render or not" decision (`<StandingsTable>` also no-ops on empty).
 */
export function MatchStandingsSection({
  entries,
  highlightTeamId,
  className,
}: MatchStandingsSectionProps) {
  if (entries.length === 0) return null;

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

      <StandingsTable entries={entries} highlightTeamId={highlightTeamId} />
    </section>
  );
}
