import { MatchesSlider } from "@/components/match/MatchesSlider/MatchesSlider";
import { SectionHeader } from "@/components/design-system";
import type { UpcomingMatch } from "@/components/match/types";

export interface MatchesSliderSectionProps {
  matches: UpcomingMatch[];
  highlightTeamId?: number;
  className?: string;
}

export const MatchesSliderSection = ({
  matches,
  highlightTeamId,
  className,
}: MatchesSliderSectionProps) => {
  if (matches.length === 0) return null;

  return (
    <section className={className}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <SectionHeader
          title="Wedstrijden"
          linkText="Alle wedstrijden"
          linkHref="/calendar"
          variant="dark"
        />

        <MatchesSlider
          matches={matches}
          highlightTeamId={highlightTeamId}
          theme="dark"
        />
      </div>
    </section>
  );
};
