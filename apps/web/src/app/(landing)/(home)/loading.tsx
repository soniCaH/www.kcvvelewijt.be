/**
 * Homepage — Loading Skeleton.
 *
 * Mirrors the spine of `(landing)/page.tsx` (#2387):
 *   <EditorialHero placement="homepage">  ← index (1280) hero band
 *     → <FirstTeamsBlock>                   ← jersey-deep-dark matchday desk
 *     → <FeaturedUitgelichtRow>            ← cream-soft 3-up Uitgelicht row
 *     → <NewsGrid>                          ← 3-up latest-news grid
 *     → <UpcomingMatches>                   ← matches band
 *     → <YouthSection>                      ← jersey-deep youth band
 *     → <SponsorsSection>                   ← sponsor logo grid
 *
 * Keep this in step with the real components: a skeleton whose aspect ratio or
 * column count differs from what replaces it makes the swap visibly reflow.
 *
 * Index width (1280) throughout. Every bar is `<Skeleton>` (#2432 §5/§6) — the
 * one primitive owning the fill token, the `motion-safe:` gate and
 * `aria-hidden`. This file's own `<h1>` is data-driven copy today, not a fixed
 * headline, so it renders no heading text.
 *
 * **Scoped by its directory, not by its siblings.** It sits in the `(home)`
 * route group so it wraps the homepage alone. Before #2791 it sat directly on
 * `(landing)/`, where it was the Suspense boundary for that segment's whole
 * subtree and shipped `Startpagina laden…` into the streamed HTML of
 * `/nieuws`, `/jeugd` and `/sponsors` — measured on the deployed app, all
 * three. An earlier version of this docblock claimed the opposite, reasoning
 * that those routes each own a `loading.tsx`; a child owning its own fallback
 * does **not** cancel the parent's (#2432 §1). The route group is what scopes
 * it. Do not move this file back up a level.
 */

import {
  PageContainer,
  StripedSeam,
  FilterTabsSkeleton,
  Skeleton,
  LoadingAnnouncement,
} from "@/components/design-system";
import { FIRST_TEAMS_ROW_GRID } from "@/components/home/FirstTeamsBlock";
import {
  UITGELICHT_ROW_CLASS,
  UITGELICHT_CARD_CLASS,
} from "@/components/home/FeaturedUitgelichtRow";

/** A flush-image card footprint — image atop a border-2 ink body. */
function CardSkeleton() {
  return (
    <div className="border-ink bg-cream-soft shadow-paper-sm overflow-hidden border-2">
      <div className="border-ink aspect-[16/9] border-b-2">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="space-y-2 p-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export default function HomeLoading() {
  return (
    <div className="bg-cream min-h-screen">
      <LoadingAnnouncement label="Startpagina laden…" />

      {/* EditorialHero — index (1280): words column beside a framed cover. */}
      <PageContainer
        width="index"
        className="pt-10 pb-4 md:pt-14 md:pb-6"
        aria-hidden="true"
      >
        <div className="grid grid-cols-1 items-center gap-x-10 gap-y-8 md:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="mt-1 h-4 w-5/6" />
          </div>
          <div className="border-ink bg-cream-soft shadow-paper-md aspect-[16/9] w-full border-2" />
        </div>
      </PageContainer>

      {/* Dit weekend — jersey-deep-dark matchday desk, seam top and bottom. */}
      <StripedSeam colorPair="cream-jersey-deep" height="md" />
      <section aria-hidden="true" className="bg-jersey-deep-dark">
        <PageContainer width="index" className="py-10 md:py-12">
          <Skeleton tone="dark" className="mb-4 h-3 w-32" />
          <Skeleton tone="dark" className="mb-8 h-9 w-64 max-w-full" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className={FIRST_TEAMS_ROW_GRID}>
              <Skeleton tone="dark" className="h-6 w-32" />
              <Skeleton tone="dark" className="h-16" />
              <Skeleton tone="dark" className="h-16" />
            </div>
          ))}
        </PageContainer>
      </section>
      <StripedSeam colorPair="cream-jersey-deep" height="md" flip />

      {/* Uitgelicht — cream-soft 3-up featured row. */}
      <div className="bg-cream-soft py-12 md:py-16">
        <PageContainer width="index">
          <Skeleton className="mb-6 h-9 w-48" />
          <ul className={UITGELICHT_ROW_CLASS}>
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className={UITGELICHT_CARD_CLASS}>
                <CardSkeleton />
              </li>
            ))}
          </ul>
        </PageContainer>
      </div>

      {/* Latest news — 3×2 grid. */}
      <PageContainer
        width="index"
        className="py-12 md:py-16"
        aria-hidden="true"
      >
        <Skeleton className="mb-6 h-9 w-56" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </PageContainer>

      {/* Upcoming matches band. */}
      <PageContainer
        width="index"
        className="py-12 md:py-16"
        aria-hidden="true"
      >
        <Skeleton className="mb-6 h-9 w-64" />
        {/* Team-chip filter row, then the stacked agenda rows — the band is a
            list, not a card grid (#2398). Chip widths approximate the real
            "Alles · A-Ploeg · U21 …" facet set. The shared
            <FilterTabsSkeleton> (#2564 review item 4) keeps this from
            drifting the way it did pre-absorption, when it modelled the
            narrower `size="sm"` UpcomingMatchesClient has since dropped. */}
        <div className="mb-5">
          <FilterTabsSkeleton
            widths={["w-16", "w-24", "w-20", "w-14", "w-16"]}
          />
        </div>
        {/* <MatchRow> is a two-line grid below `sm` and one line above it, so
            the skeleton has to be too or the swap reflows on mobile — the exact
            viewport the youth-parent path targets. */}
        <div className="flex flex-col gap-3 motion-safe:animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="border-ink bg-cream shadow-paper-sm h-[86px] border-2 sm:h-[70px]"
            />
          ))}
        </div>
      </PageContainer>

      {/* Youth band — jersey-deep field with seam at its top edge. */}
      <StripedSeam colorPair="cream-jersey-deep" height="md" />
      <section aria-hidden="true" className="bg-jersey-deep py-16 md:py-20">
        <PageContainer width="index">
          <Skeleton tone="dark" className="mb-4 h-3 w-28" />
          <Skeleton tone="dark" className="mb-3 h-10 w-72 max-w-full" />
          <Skeleton tone="dark" className="mb-8 h-4 w-96 max-w-full" />
          <div className="flex gap-3">
            {/* Not a <Skeleton> (a distinct warm CTA accent, not the shared
                bar fill), so it keeps its own motion-safe gate — the
                sibling <Skeleton> already owns its. A shared parent gate
                here would double the pulse on the Skeleton (nested
                animate-pulse multiplies opacity). */}
            <div className="bg-warm/50 h-11 w-40 motion-safe:animate-pulse" />
            <Skeleton tone="dark" className="h-11 w-40" />
          </div>
        </PageContainer>
      </section>

      {/* Sponsors — logo grid. */}
      <PageContainer
        width="index"
        className="py-12 md:py-16"
        aria-hidden="true"
      >
        <Skeleton className="mb-6 h-9 w-44" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border-ink bg-cream shadow-paper-sm aspect-[3/2] border-2"
            />
          ))}
        </div>
      </PageContainer>
    </div>
  );
}
