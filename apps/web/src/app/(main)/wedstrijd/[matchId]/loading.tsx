/**
 * Match Detail Page — Loading Skeleton.
 *
 * Mirrors the Phase 6.B composition of `wedstrijd/[matchId]/page.tsx`:
 *   (<MatchStripSlot> is not drawn here: `./layout.tsx` mounts the real
 *    strip above this file, so it stays on screen while the page loads, #3027)
 *   <MatchHero>                 ← single TapedCard (stub + score body)
 *     → <StripedSeam>
 *     → <MatchLineupSection>     ← kicker + heading + 2-col lineup rows
 *     → <StripedSeam>
 *     → <MatchEventsSection>     ← kicker + heading + timeline rows
 *     → <StripedSeam>
 *     → <MatchStandingsSection>  ← kicker + heading + head-to-head table
 *     → <StripedSeam>
 *     → <RelatedRow>             ← full-bleed cream slider of w-72/w-80 cards
 *       (#2581 replaces the old bordered `<MatchArticleLinkCard>` with the
 *       shared cross-route related-content row; matched here on the
 *       structural facts only — full-bleed outside `PageContainer`, a
 *       horizontal row of card-width blocks — not #2581's exact card chrome,
 *       which is still under review)
 *
 * `<MatchHero>` owns the page's `<h1>` from the two club names — data — so
 * this renders no heading text at all, bars only.
 *
 * All wide (1040), cream-on-paper register. `min-h-screen` root preserved per
 * the envelope-drift guard in
 * `apps/web/src/app/__tests__/loading-envelope.test.tsx` — non-SectionStack
 * routes pin to a contract root className.
 */

import {
  PageContainer,
  StripedSeam,
  Skeleton,
  LoadingAnnouncement,
  UpLink,
} from "@/components/design-system";

/** Shared kicker + display-heading footprint for the cream body sections. */
function SectionHeadingSkeleton() {
  return (
    <>
      <Skeleton className="mb-3 h-3 w-32" />
      <Skeleton className="mb-8 h-8 w-64 md:mb-10" />
    </>
  );
}

export default function MatchDetailLoading() {
  return (
    <div className="min-h-screen">
      <LoadingAnnouncement label="Wedstrijd laden…" />

      {/* MatchHero — single TapedCard with a dashed stub + score body. Top
          air is `<UpLink>`'s own now (#2877) — this container keeps only
          its bottom padding, matching the page's exactly: no field colour
          (no `bg-cream-soft` — the page's equivalent container carries
          none either) and `pb-12 lg:pb-16` (#3023). The element type does
          not match — `as="section"` here, a plain `<div>` on the page — see
          `apps/web/src/app/__tests__/cross-page-consistency.test.ts`'s rule
          15, which asserts the className match directly against the page's
          own source rather than repeating the values here. */}
      <PageContainer as="section" className="pb-12 lg:pb-16">
        {/* Real, unshimmered — its label is fixed copy, not data
            (review round 2, #2570). */}
        <UpLink href="/kalender" label="Kalender" className="mb-6" />
        <div
          aria-hidden="true"
          className="border-ink bg-cream shadow-paper-md grid grid-cols-1 border-2 md:grid-cols-[110px_1fr]"
        >
          <div className="border-ink space-y-2 border-b-2 border-dashed p-5 md:border-r-2 md:border-b-0">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex flex-col gap-6 p-5 md:p-6">
            <Skeleton className="h-3 w-32" />
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <Skeleton className="h-5 max-w-32 min-w-0 flex-1" />
              </div>
              <Skeleton className="h-8 w-16" />
              <div className="flex min-w-0 flex-row-reverse items-center gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <Skeleton className="h-5 max-w-32 min-w-0 flex-1" />
              </div>
            </div>
            <div className="border-ink border-t pt-3">
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </div>
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* MatchLineupSection — kicker + heading + 2 columns of 11 lineup rows. */}
      <PageContainer
        as="section"
        className="bg-cream py-12 sm:py-16"
        aria-hidden="true"
      >
        <SectionHeadingSkeleton />
        <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, col) => (
            <div key={col}>
              <div className="border-ink mb-3 border-t pt-2">
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="space-y-2">
                {Array.from({ length: 11 }).map((_, row) => (
                  <div key={row} className="flex items-center gap-3 py-1.5">
                    <Skeleton className="h-7 w-7" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* MatchEventsSection — kicker + heading + timeline rows. */}
      <PageContainer
        as="section"
        className="bg-cream py-12 sm:py-16"
        aria-hidden="true"
      >
        <SectionHeadingSkeleton />
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* MatchStandingsSection — kicker + heading + head-to-head table rows. */}
      <PageContainer
        as="section"
        className="bg-cream py-12 sm:py-16"
        aria-hidden="true"
      >
        <SectionHeadingSkeleton />
        <div className="border-ink shadow-paper-sm border-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="border-ink flex items-center gap-4 border-b-2 px-4 py-3 last:border-b-0"
            >
              <Skeleton className="h-4 w-5" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* RelatedRow — full-bleed cream band OUTSIDE PageContainer (matches
          RelatedRow.tsx's own root exactly: "bg-cream w-full px-4 pt-8
          pb-16 lg:pt-10 lg:pb-24"), a heading bar, then a horizontal row of
          w-72/md:w-80 card blocks — not wrapped in PageContainer, since the
          real row isn't either. */}
      <section
        aria-hidden="true"
        className="bg-cream w-full px-4 pt-8 pb-16 lg:pt-10 lg:pb-24"
      >
        <div
          className="mx-auto w-full"
          style={{ maxWidth: "var(--container-wide)" }}
        >
          <Skeleton className="mb-10 h-9 w-72 max-w-full" />
          <div className="flex gap-6 overflow-hidden md:gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="border-ink bg-cream-soft shadow-paper-sm w-72 shrink-0 border-2 md:w-80"
              >
                <div className="border-ink aspect-[16/9] w-full border-b-2">
                  <Skeleton className="h-full w-full" />
                </div>
                <div className="space-y-2 p-4">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
