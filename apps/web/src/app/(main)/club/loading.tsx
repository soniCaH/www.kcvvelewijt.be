/**
 * `/club` index loading skeleton — mirrors the Phase 10 composition on cream
 * (compact `<PageHero>` → seam → editorial nav grid). Replaces the legacy
 * `SectionStack`/`getClubSections` envelope. Only the nav-hub grid is
 * shimmered; the hero renders instantly (it carries no data).
 */

import { PageContainer, StripedSeam } from "@/components/design-system";
import { PageHero } from "@/components/layout/PageHero";

export default function ClubLoading() {
  return (
    <div className="bg-cream min-h-screen">
      {/* Hero — compact PageHero (typographic). */}
      <PageContainer width="index" className="pt-10 pb-12">
        <PageHero
          size="compact"
          kicker="Onze club"
          headline="De plezantste compagnie"
          accent="compagnie"
        />
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Editorial nav hub — header + uniform 3-up grid. */}
      <PageContainer width="index" className="py-12">
        <div className="bg-ink/10 mb-8 h-10 w-72 max-w-full animate-pulse rounded" />
        <div
          data-testid="club-hub-skeleton"
          className="grid animate-pulse grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="border-ink shadow-paper-sm bg-cream-soft flex h-full flex-col overflow-hidden border-2"
            >
              <div className="bg-ink/10 border-ink aspect-[16/9] border-b-2" />
              <div className="flex flex-col gap-2 p-3.5">
                <div className="bg-ink/10 h-5 w-3/4 rounded" />
                <div className="bg-ink/10 h-3 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </div>
  );
}
