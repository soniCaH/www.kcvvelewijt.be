/**
 * Player Detail Page — Loading Skeleton (Phase 6.A).
 *
 * Mirrors the new `/spelers/[slug]` composition at the chrome level —
 * `<MatchStripSlot>` (its own `MatchStripSkeleton` fallback drawn directly
 * here, #3023), `<PlayerHero>` block, `<StripedSeam>`, and a bio paragraph
 * footprint. Subject-specific surfaces (photo, name, bio text, ink quote
 * card) are intentionally NOT skeletonised: their auto-hide branches mean a
 * single skeleton can't accurately predict what will render. The player's
 * name is data, so `<PlayerHero>`'s own `<h1>` never renders here — bars
 * only.
 */

import {
  PageContainer,
  Skeleton,
  LoadingAnnouncement,
  UpLink,
} from "@/components/design-system";
import { MatchStripSkeleton } from "@/components/layout/MatchStrip/MatchStripSkeleton";

export default function PlayerDetailLoading() {
  return (
    <div className="min-h-screen">
      <LoadingAnnouncement label="Spelersprofiel laden…" />

      {/* MatchStripSlot's own fallback — see its docblock (#3023). */}
      <MatchStripSkeleton />

      <PageContainer as="section" className="pb-12 lg:pb-16">
        {/* Real, unshimmered — its label is fixed copy, not data
            (review round 2, #2570). */}
        <UpLink href="/ploegen" label="Ploegen" className="mb-6" />
        <div
          aria-hidden="true"
          className="grid grid-cols-1 items-start gap-x-10 gap-y-8 sm:grid-cols-[1fr_minmax(220px,320px)]"
        >
          <div className="flex flex-col gap-5">
            <Skeleton className="h-4 w-24" />
            {/* No number-cell bar — #2642's rule ("a skeleton draws only
                what it can know before the fetch") applies here exactly
                as it already does to the photo/name/bio surfaces this
                file's own header comment calls out: jerseyNumber is an
                auto-hide branch (#2585 owner decision, 2026-09-20 — the
                number cell hides when absent, it is not reserved), not a
                fixed opening. Drawing any shaped bar here — sized to the
                filled state or to a since-removed reserved slot — would
                mispromise a number cell on essentially every load, since
                production measures zero of 352 player documents with
                jerseyNumber set. */}
            <div className="space-y-2">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-10 w-2/3" />
            </div>
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="aspect-[3/4] w-full max-w-[320px] justify-self-start sm:justify-self-end" />
        </div>
      </PageContainer>
      <Skeleton className="h-[18px] w-full" />
      <PageContainer
        as="section"
        className="bg-cream py-12 sm:py-16"
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
