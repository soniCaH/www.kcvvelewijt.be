/**
 * Ultras Page — Loading Skeleton.
 *
 * Mirrors `UltrasPage` (`/club/ultras`):
 *   <UltrasHero> (full-bleed jersey-deep-dark terrace band: kicker + heavy
 *     headline + lead + CTA)
 *     → <PageContainer> article: <UltrasSection> blocks (kicker + heading +
 *       paragraph bars) with embedded taped image figures
 *
 * Default width (1040). Canonical paper-register chrome only — `border-2
 * border-ink`, square corners, `cream-soft`/`paper-edge` fills, pulse bars.
 */

import { PageContainer } from "@/components/design-system";

/** An editorial section footprint: kicker + heading + paragraph bars. */
function SectionSkeleton({ withImage = false }: { withImage?: boolean }) {
  return (
    <section className="mt-14 first:mt-0">
      <div className="mb-5 flex flex-col gap-2">
        <div className="bg-paper-edge h-3 w-28" />
        <div className="bg-paper-edge h-8 w-56" />
      </div>
      <div className="space-y-3">
        <div className="bg-paper-edge h-4 w-full" />
        <div className="bg-paper-edge h-4 w-full" />
        <div className="bg-paper-edge h-4 w-5/6" />
      </div>
      {withImage ? (
        <div className="border-ink bg-cream-soft shadow-paper-md mt-6 aspect-[16/9] w-full border-2" />
      ) : null}
    </section>
  );
}

export default function UltrasLoading() {
  return (
    <div className="min-h-screen">
      <span
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="sr-only"
      >
        Ultras laden...
      </span>

      {/* UltrasHero — full-bleed jersey-deep-dark terrace band. */}
      <header
        aria-hidden="true"
        className="bg-jersey-deep-dark relative isolate overflow-hidden"
      >
        <div className="relative z-10 mx-auto flex max-w-[var(--container-wide)] flex-col items-center gap-6 px-4 py-24 text-center motion-safe:animate-pulse sm:py-32 md:px-8">
          <div className="bg-cream/20 h-3 w-48" />
          <div className="bg-cream/25 h-14 w-2/3 max-w-full" />
          <div className="bg-cream/15 h-4 w-96 max-w-full" />
          <div className="bg-warm/50 h-12 w-56" />
        </div>
      </header>

      {/* Editorial sections — kicker + heading + paragraph bars + figures. */}
      <PageContainer
        as="article"
        className="py-12 motion-safe:animate-pulse sm:py-16"
      >
        <SectionSkeleton withImage />
        <SectionSkeleton withImage />
        <SectionSkeleton />
      </PageContainer>
    </div>
  );
}
