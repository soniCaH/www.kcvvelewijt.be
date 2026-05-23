import { EditorialHeading, MonoLabelRow } from "@/components/design-system";
import { cn } from "@/lib/utils/cn";
import { MatchLineup, type LineupPlayer } from "../MatchLineup/MatchLineup";

export interface MatchLineupSectionProps {
  homeTeamName: string;
  awayTeamName: string;
  homeLineup: readonly LineupPlayer[];
  awayLineup: readonly LineupPlayer[];
  className?: string;
}

/**
 * Section wrapper around `<MatchLineup>` for the Phase 6.B match-detail page
 * (6.B.d3 lock). Adds the editorial chrome — mono caps kicker
 * (`* OPSTELLINGEN`) + display-md italic heading (`Wie er stond.`) + paper
 * container — around the existing per-row primitive.
 *
 * Auto-hide: returns `null` when both lineups are empty (typically upcoming
 * matches). The caller mounts this unconditionally; this component owns the
 * "render or not" decision.
 */
export function MatchLineupSection({
  homeTeamName,
  awayTeamName,
  homeLineup,
  awayLineup,
  className,
}: MatchLineupSectionProps) {
  if (homeLineup.length === 0 && awayLineup.length === 0) return null;

  return (
    <section
      data-component="match-lineup-section"
      className={cn(
        "bg-cream mx-auto w-full max-w-[var(--container-wide)] px-4 py-10 md:py-14",
        className,
      )}
    >
      <MonoLabelRow
        items={[{ label: "OPSTELLINGEN" }]}
        className="text-ink mb-3"
      />
      <EditorialHeading level={2} size="display-md" className="mb-8 md:mb-10">
        Wie er stond.
      </EditorialHeading>

      <MatchLineup
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        homeLineup={[...homeLineup]}
        awayLineup={[...awayLineup]}
      />
    </section>
  );
}
