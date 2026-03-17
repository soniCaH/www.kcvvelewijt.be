import Link from "next/link";
import { MatchesSlider } from "@/components/match/MatchesSlider/MatchesSlider";
import { SectionDivider } from "@/components/design-system";
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
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white border-l-4 border-kcvv-green pl-3">
            Wedstrijden
          </h2>
          <Link
            href="/calendar"
            className="text-sm text-kcvv-green hover:text-white transition-colors font-medium"
          >
            Alle wedstrijden →
          </Link>
        </div>

        <MatchesSlider
          matches={matches}
          highlightTeamId={highlightTeamId}
          theme="dark"
        />
      </div>
    </section>
  );
};
