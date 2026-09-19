/**
 * Staff Detail Page — Loading Skeleton.
 *
 * Mirrors the `/spelers/[slug]` skeleton at the chrome level — a bare hero
 * grid (figure on the LEFT for staff), a seam bar, and a bio paragraph
 * footprint on a cream band — over the near-white page background. Bars stay
 * sharp-cornered per the redesign vocabulary. The staff member's name is
 * data, so this renders no heading text at all.
 */

import {
  PageContainer,
  Skeleton,
  LoadingAnnouncement,
  UpLink,
} from "@/components/design-system";

export default function StaffDetailLoading() {
  return (
    <div className="min-h-screen">
      <LoadingAnnouncement label="Stafprofiel laden…" />

      {/* Hero footprint — figure left, text right (mirrors PlayerHero). Top
          air is `<UpLink>`'s own now (#2877), so this container keeps only
          its bottom padding. */}
      <PageContainer as="section" className="pb-12 lg:pb-16">
        {/* Real, unshimmered — its label is fixed copy, not data
            (review round 2, #2570). */}
        <UpLink href="/hulp" label="Hulp" className="mb-6" />
        <div
          aria-hidden="true"
          className="grid grid-cols-1 items-start gap-x-10 gap-y-8 sm:grid-cols-[minmax(220px,320px)_1fr]"
        >
          <Skeleton className="aspect-[3/4] w-full max-w-[320px] justify-self-start" />
          <div className="flex flex-col gap-5">
            <Skeleton className="h-4 w-16" />
            <div className="space-y-2">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-10 w-2/3" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </PageContainer>

      {/* Single seam bar (matches the page's lone post-hero seam). Already
          aria-hidden — <Skeleton> bakes that in unconditionally. */}
      <Skeleton className="h-[18px] w-full" />

      {/* Bio footprint — cream band. */}
      <PageContainer
        as="section"
        className="bg-cream py-12 lg:py-16"
        aria-hidden="true"
      >
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-10/12" />
        </div>
      </PageContainer>
    </div>
  );
}
