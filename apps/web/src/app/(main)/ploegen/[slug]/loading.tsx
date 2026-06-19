/**
 * Team Detail Page — Loading Skeleton.
 *
 * Mirrors the Phase 6.C single-scroll composition of `ploegen/[slug]/page.tsx`:
 *   <TeamHero>               ← wide (1040) hero: words + taped team figure
 *     → <TeamSectionNav>      ← sticky border-y-2 ink pill bar
 *     → <StripedSeam>
 *     → <SquadGrid>           ← position-grouped squad (auto-fill minmax(140px,
 *       1fr), border-2 ink cards)
 *
 * Conservative: most non-hero sections (standings, matches, staff, editorial)
 * auto-hide on empty data, so the skeleton only previews the always-present
 * hero + nav + a representative squad block. `min-h-screen` root preserved per
 * the envelope-drift guard.
 */

import { PageContainer, StripedSeam } from "@/components/design-system";

export default function TeamDetailLoading() {
  return (
    <div className="min-h-screen">
      <span
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="sr-only"
      >
        Ploeg laden...
      </span>

      {/* TeamHero — wide (1040): words column + taped team figure. */}
      <section
        aria-hidden="true"
        className="mx-auto grid w-full max-w-[var(--container-wide)] animate-pulse grid-cols-1 items-start gap-x-10 gap-y-8 px-4 py-8 sm:grid-cols-[1fr_minmax(300px,420px)] sm:py-12 md:px-8"
      >
        <div className="order-last flex flex-col gap-4 sm:order-first">
          <div className="bg-paper-edge h-3 w-28" />
          <div className="bg-paper-edge h-12 w-48" />
          <div className="flex gap-2">
            <div className="bg-paper-edge h-6 w-24" />
            <div className="bg-paper-edge h-6 w-16" />
          </div>
          <div className="bg-paper-edge h-4 w-64 max-w-full" />
        </div>
        <div className="border-ink bg-cream-soft shadow-paper-md order-first aspect-[3/2] w-full border-2 sm:order-last" />
      </section>

      {/* TeamSectionNav — sticky border-y-2 ink pill bar. */}
      <div aria-hidden="true" className="border-ink bg-cream border-y-2">
        <PageContainer className="flex animate-pulse items-center gap-2 py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-paper-edge h-5 w-20" />
          ))}
        </PageContainer>
      </div>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* SquadGrid — position-grouped: auto-fill minmax(140px,1fr) ink cards. */}
      <PageContainer as="section" className="py-10">
        <div className="flex animate-pulse flex-col gap-8">
          {Array.from({ length: 2 }).map((_, group) => (
            <div key={group}>
              <div className="border-paper-edge mb-3 border-b pb-1.5">
                <div className="bg-paper-edge h-3 w-28" />
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
                {Array.from({ length: group === 0 ? 4 : 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="border-ink bg-cream shadow-paper-sm flex flex-col items-center border-2 p-3 text-center"
                  >
                    <div className="border-ink bg-cream-soft h-16 w-16 rounded-full border-2" />
                    <div className="bg-paper-edge mt-2 h-4 w-3/4" />
                    <div className="bg-paper-edge mt-1 h-2 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </div>
  );
}
