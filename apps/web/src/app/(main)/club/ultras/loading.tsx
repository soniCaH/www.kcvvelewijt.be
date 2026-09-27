/**
 * Ultras Page — Loading Skeleton.
 *
 * Mirrors `UltrasPage` (`/club/ultras`):
 *   <UltrasHero> (full-bleed jersey-deep-dark terrace band: kicker + heavy
 *     headline + lead + CTA — fixed copy, a static bundled photo, no fetch)
 *     → <PageContainer> article: <UltrasSection> blocks (kicker + heading +
 *       paragraph bars) with embedded taped image figures
 *
 * `<UltrasHero>` has no data dependency, so per #2432 §2 this reuses it
 * directly, unshimmered — the real `<h1>` ships from the first byte.
 *
 * Default width (1040). Canonical paper-register chrome only — `border-2
 * border-ink`, square corners, `cream-soft`/`paper-edge` fills, pulse bars.
 */

import {
  PageContainer,
  Skeleton,
  LoadingAnnouncement,
} from "@/components/design-system";
import { UltrasHero } from "./UltrasHero";
import { FACEBOOK_URL } from "./copy";

/** An editorial section footprint: kicker + heading + paragraph bars. */
function SectionSkeleton({ withImage = false }: { withImage?: boolean }) {
  return (
    <section className="mt-14 first:mt-0">
      <div className="mb-5 flex flex-col gap-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-56" />
      </div>
      {/* Paragraph bars take the prose token like the real copy (#2436); the
          figure below keeps the container's full width. */}
      <div className="max-w-[var(--container-prose)] space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
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
      <LoadingAnnouncement label="Ultras laden…" />

      <UltrasHero
        joinHref={FACEBOOK_URL}
        upLink={{ href: "/club", label: "De club" }}
      />

      {/* Editorial sections — kicker + heading + paragraph bars + figures. */}
      <PageContainer as="article" className="py-12 sm:py-16">
        <SectionSkeleton withImage />
        <SectionSkeleton withImage />
        <SectionSkeleton />
      </PageContainer>
    </div>
  );
}
