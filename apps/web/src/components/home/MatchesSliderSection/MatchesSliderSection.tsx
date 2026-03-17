import { MatchesSlider } from "@/components/match/MatchesSlider/MatchesSlider";
import { SectionDivider, SectionHeader } from "@/components/design-system";
import type { UpcomingMatch } from "@/components/match/types";
import { cn } from "@/lib/utils/cn";

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
    <section
      className={cn("relative bg-kcvv-black overflow-hidden py-20", className)}
    >
      {/* Diagonal top cut: gray-100 → kcvv-black */}
      <SectionDivider color="gray-100" position="top" />

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 pt-4">
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
