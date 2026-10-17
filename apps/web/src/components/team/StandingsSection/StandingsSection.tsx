import type { RankingTable } from "@kcvv/api-contract";
import { StandingsTable } from "@/components/team/StandingsTable";
import { EmptyState } from "@/components/design-system/EmptyState";
import { classifyStandingsTables } from "@/lib/utils/competitive-block-state";
import { cn } from "@/lib/utils/cn";

export interface StandingsSectionProps {
  /** Every official table the association publishes for this team, in feed
   * order. A senior side has one; every youth side gets a fresh poule at the
   * winter break and so ends the season with two. */
  tables: readonly RankingTable[];
  /** Sanity's editorial reeks name. Wins over the provider's, because the
   * federation's name for a reeks is not the club's — the club says
   * `3e Nationale VV A` where the provider files `3de Afdeling Voetb Vl A`
   * (#2589 decision 4). */
  divisionFull?: string | null;
  /** Club id of the KCVV row to highlight in every table. */
  highlightClubId?: number;
  className?: string;
}

/**
 * The content of `#klassement` — N league tables under one section (#2631).
 *
 * Never two sections: #2540 gives `#klassement` exactly one `<h2>`, one
 * `StripedSeam` and one nav entry, and splitting the phases into two sections
 * breaks that invariant. The `<h2>` itself landed with the rest of the
 * heading sweep (#2637) — rendered by `page.tsx` via `<SectionHeader>`
 * immediately above this component, not inside it (`page.tsx` already has
 * the resolved `klassementLabel`, so this component doesn't need one).
 *
 * The parent only mounts this component once the competitive block's fixture
 * gate is open (#2636) — so unlike before #2636, this component never auto-
 * hides itself. `#klassement` shows the clubs it has and the numbers it has,
 * and it never says a table is coming (#2605): no rows yet renders a present-
 * tense note in its own voice rather than a bare `null`.
 *
 * Each table decides its own numberless/live render from its own `entries`
 * (`<StandingsTable>`, via `isNumberlessTable`) — this component does not
 * compute or pass that verdict. A youth side past the winter break can have
 * a scored autumn poule next to an unplayed spring one, and a single
 * block-level verdict applied to both would render the unplayed poule as a
 * full table of position-0 zeroes (#2636 finding 4 / finding 9).
 */
export function StandingsSection({
  tables,
  divisionFull,
  highlightClubId,
  className,
}: StandingsSectionProps) {
  if (classifyStandingsTables(tables) === "no-table") {
    return (
      <div data-testid="standings-section" className={cn("flex", className)}>
        <EmptyState tier="slot">
          Voor deze reeks is er geen klassement.
        </EmptyState>
      </div>
    );
  }

  return (
    <div
      data-testid="standings-section"
      className={cn("flex flex-col gap-10", className)}
    >
      {tables
        .filter((table) => table.entries.length > 0)
        .map((table) => (
          <StandingsTable
            key={table.competition_id}
            entries={table.entries}
            caption={divisionFull ?? table.competition_name}
            highlightClubId={highlightClubId}
          />
        ))}
    </div>
  );
}
