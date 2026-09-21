/**
 * BoardPageLoading — shared loading skeleton for the board pages
 * (`/club/bestuur`, `/club/angels`, `/club/jeugdbestuur`).
 *
 * Mirrors `BestuurPage` (the shared shell for all three routes):
 *   <PageHero register="band" tone="dark"> (kicker + headline + group photo)
 *     → <StripedSeam>
 *     → "De leden" — one <PersonCardRun> (mono-caps run heading over
 *       <TeamStaff>'s <PlayerCard> grid: auto-fill minmax(140px,1fr), each
 *       card a 3:4 portrait photo/illustration slot, not a round avatar)
 *     → <BoardCtaBand> (jersey-deep-dark closing band)
 *
 * Canonical paper-register chrome only — square corners, `paper-edge`/`cream`
 * fills, `motion-safe:animate-pulse` bars. No phantom "staff list" block, no
 * gray/rounded chrome.
 *
 * The `label` prop drives the sr-only `role="status"` text (e.g. "Bestuur
 * laden..."), the only per-route difference between the three skeletons.
 */

import {
  PageContainer,
  StripedSeam,
  Skeleton,
  LoadingAnnouncement,
} from "@/components/design-system";
import { PageHeroSkeleton } from "@/components/layout/PageHero";

export function BoardPageLoading({ label }: { label: string }) {
  return (
    <div className="min-h-screen space-y-12">
      <LoadingAnnouncement label={label} />

      {/* No kicker (the real hero dropped it in favour of the up-link
          inside the band, #2442 rule 6) and the up-link renders real,
          unshimmered — its "De club" label is fixed copy, not data
          (review round 2, #2570). */}
      <PageHeroSkeleton
        register="band"
        tone="dark"
        image
        lead
        kicker={false}
        upLink={{ href: "/club", label: "De club" }}
      />

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* "De leden" — one <PersonCardRun>: a mono-caps run heading over
          <TeamStaff>'s grid. Track is exactly PersonCardRun.tsx's own
          `grid-cols-[repeat(auto-fill,minmax(140px,1fr))]` — 140px, not
          150px — and each card's photo slot is a 3:4 portrait block
          (PlayerCard.tsx's own `aspect-[3/4]`), not a round avatar. Card
          chrome beyond the track and the aspect ratio is deliberately not
          mirrored here (#2575 is still applying review fixes to it). */}
      <PageContainer as="section" className="py-12 sm:py-16">
        <div className="border-paper-edge mb-3 border-b pb-1.5">
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="border-ink bg-cream shadow-paper-sm flex flex-col items-center border-2 p-3 text-center"
            >
              <div className="border-ink bg-cream-soft aspect-[3/4] w-full border-2" />
              <Skeleton className="mt-2 h-4 w-3/4" />
              <Skeleton className="mt-1 h-2 w-1/2" />
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
        <PageContainer className="py-12 text-center sm:py-16">
          <Skeleton tone="dark" className="mx-auto mb-4 h-9 w-64" />
          <Skeleton tone="dark" className="mx-auto mb-7 h-4 w-80 max-w-full" />
          <div className="bg-warm/60 mx-auto h-11 w-48 motion-safe:animate-pulse" />
        </PageContainer>
      </section>
    </div>
  );
}
