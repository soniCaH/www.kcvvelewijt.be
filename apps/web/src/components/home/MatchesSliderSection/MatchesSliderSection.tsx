import { MatchesSlider } from "@/components/match/MatchesSlider/MatchesSlider";
import { SectionHeader } from "@/components/design-system";
import { MatchesSliderEmptyState } from "@/components/home/MatchesSliderEmptyState";
import type { UpcomingMatch } from "@/components/match/types";
import type { MatchesSliderPlaceholderVM } from "@/lib/repositories/homepage.repository";

export interface MatchesSliderSectionProps {
  matches: UpcomingMatch[];
  highlightTeamId?: number;
  placeholder?: MatchesSliderPlaceholderVM | null;
  className?: string;
}

export const MatchesSliderSection = ({
  matches,
  highlightTeamId,
  placeholder,
  className,
}: MatchesSliderSectionProps) => {
  return (
    <section className={className}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <SectionHeader
          title="Wedstrijden"
          linkText="Alle wedstrijden"
          linkHref="/kalender"
          variant="dark"
        />

        {matches.length === 0 ? (
          <MatchesSliderEmptyState placeholder={placeholder} />
        ) : (
          <MatchesSlider
            matches={matches}
            highlightTeamId={highlightTeamId}
            theme="dark"
          />
        )}
      </div>
    </section>
  );
};
