/**
 * Angels Page — Loading Skeleton.
 *
 * Mirrors `BestuurPage` (the shared shell for `/club/bestuur`, `/club/angels`,
 * `/club/jeugdbestuur`):
 *   <BoardHero> (jersey-deep-dark band: kicker + headline + group photo)
 *     → <StripedSeam>
 *     → "De leden" — <TeamStaff> grid (auto-fill minmax(150px,1fr), border-2
 *       ink cards)
 *     → <BoardCtaBand> (jersey-deep-dark closing band)
 *
 * Canonical paper-register chrome only — square corners, `paper-edge`/`cream`
 * fills, `motion-safe:animate-pulse` bars. No phantom "staff list" block, no
 * gray/rounded chrome.
 */

import { PageContainer, StripedSeam } from "@/components/design-system";

export default function AngelsLoading() {
  return (
    <div className="min-h-screen space-y-12">
      <span
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="sr-only"
      >
        Angels laden...
      </span>

      {/* BoardHero — jersey-deep-dark band: kicker + headline beside group photo. */}
      <header aria-hidden="true" className="bg-jersey-deep-dark">
        <div className="mx-auto grid max-w-[var(--container-wide)] animate-pulse gap-8 px-4 py-14 sm:py-20 md:grid-cols-[1fr_auto] md:items-center md:px-8">
          <div className="flex flex-col gap-4">
            <div className="bg-cream/20 h-3 w-24" />
            <div className="bg-cream/25 h-12 w-2/3" />
            <div className="bg-cream/15 h-5 w-1/2" />
          </div>
          <div className="border-ink bg-cream-soft shadow-paper-md aspect-[3/2] w-full border-2 md:w-[24rem]" />
        </div>
      </header>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* "De leden" — staff grid: auto-fill minmax(150px,1fr), border-2 ink cards. */}
      <PageContainer as="section" className="py-12">
        <div className="bg-paper-edge mb-6 h-9 w-40 animate-pulse" />
        <div className="grid animate-pulse grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="border-ink bg-cream flex flex-col items-center border-2 p-3 text-center shadow-[3px_3px_0_0_var(--color-ink)]"
            >
              <div className="border-ink bg-cream-soft h-16 w-16 rounded-full border-2" />
              <div className="bg-paper-edge mt-2 h-4 w-3/4" />
              <div className="bg-paper-edge mt-1 h-2 w-1/2" />
            </div>
          ))}
        </div>
      </PageContainer>

      {/* BoardCtaBand footprint — leading seam + jersey-deep-dark band. */}
      <StripedSeam colorPair="ink-cream" height="md" />
      <section
        aria-hidden="true"
        className="bg-jersey-deep-dark border-ink border-y-2"
      >
        <div className="mx-auto max-w-[var(--container-wide)] animate-pulse px-4 py-12 text-center sm:py-16 md:px-8">
          <div className="bg-cream/25 mx-auto mb-4 h-9 w-64" />
          <div className="bg-cream/15 mx-auto mb-7 h-4 w-80 max-w-full" />
          <div className="bg-warm/60 mx-auto h-11 w-48" />
        </div>
      </section>
    </div>
  );
}
