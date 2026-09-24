import { PageContainer, SectionHeader } from "@/components/design-system";
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
    <PageContainer
      as="section"
      className={cn("bg-cream py-12 sm:py-16", className)}
    >
      <SectionHeader
        kicker={[{ label: "OPSTELLINGEN" }]}
        title="Wie er stond."
        size="display-md"
      />

      <MatchLineup
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        homeLineup={[...homeLineup]}
        awayLineup={[...awayLineup]}
      />
    </PageContainer>
  );
}
