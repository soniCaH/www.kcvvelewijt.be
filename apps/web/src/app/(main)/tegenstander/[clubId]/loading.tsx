/**
 * Opponent History Page — Loading Skeleton
 *
 * Paper-register skeleton mirroring the #2141 reskin: a light hero card, a
 * squad-heading bar, the five-cell summary, a striped seam, and a
 * season-grouped row placeholder. The opponent's name — and, since #2463,
 * the squad name too — is data, so this renders no heading text, only its
 * chrome. Bars inside the `bg-cream` cards (hero, W/D/L cells, season rows)
 * use `<Skeleton>`'s default `paper-edge` fill; the squad-heading, list
 * header and season-band bars sit directly on the page's `bg-cream-deep`
 * root and use `tone="deep"` instead — `paper-edge` is calibrated against
 * plain cream and is an 8/5/2 RGB delta away from `cream-deep`, invisible
 * once `animate-pulse` fades it. Card chrome (borders + paper shadow) stays
 * solid.
 *
 * Deliberately stays single-section (#2463 rule): before the fetch resolves
 * this route cannot know how many squads met the opponent, and most
 * opponents produce exactly one section, so this only draws one squad
 * heading + one summary card + one match list, never two. Adding the squad
 * heading bar is the one adjustment the new per-squad layout makes
 * structurally necessary — without it, everything below the hero sat one
 * heading's height higher than the real render, so the page visibly
 * shifted down the moment the fetch resolved.
 */

import {
  PageContainer,
  StripedSeam,
  Skeleton,
  LoadingAnnouncement,
  UpLink,
} from "@/components/design-system";

export default function OpponentLoading() {
  return (
    <div className="bg-cream-deep min-h-screen">
      <LoadingAnnouncement label="Tegenstander laden…" />

      {/* Top air is `<UpLink>`'s own now (#2877) — this container keeps
          only its bottom padding, matching the real page's chip offset
          exactly so the chip does not move when the page resolves. */}
      <PageContainer className="pb-8">
        {/* Real, unshimmered — its label is fixed copy, not data (review
            round 2, #2570). */}
        <UpLink href="/kalender" label="Kalender" className="mb-6" />

        {/* Hero card */}
        <div className="border-ink bg-cream shadow-paper-md border-2 p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-9 w-2/3" />
            </div>
          </div>
          <Skeleton className="mt-4 h-3 w-3/4" />
        </div>

        {/* Squad heading — mirrors <SquadHistorySection>'s h2: mt-7 off the
            hero card, mb-4 before the summary card, same bar size/ground as
            the list-header bar below (both display-sm on bg-cream-deep). */}
        <Skeleton tone="deep" className="mt-7 mb-4 h-6 w-32" />

        {/* W/D/L summary */}
        <div className="border-ink bg-cream shadow-paper-sm grid grid-cols-5 border-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="border-ink flex flex-col items-center gap-2 border-r-2 px-1.5 py-4 last:border-r-0"
            >
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-2 w-6" />
            </div>
          ))}
        </div>

        {/* Seam */}
        <div className="mt-8 mb-5">
          <StripedSeam height="sm" />
        </div>

        {/* Match-count heading (the h3 inside a squad section) — sits
            directly on the bg-cream-deep root, so the
            deep tone is required (paper-edge is invisible here). */}
        <Skeleton tone="deep" className="mb-4 h-6 w-44" />

        {/* Season band */}
        <div className="mb-2.5 flex items-center gap-2.5">
          <Skeleton tone="deep" className="h-5 w-28" />
          <div className="border-ink/30 h-0 flex-1 border-t-2 border-dotted" />
          <Skeleton tone="deep" className="h-2 w-16" />
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="border-ink bg-cream shadow-paper-sm flex items-stretch border-2"
            >
              <div className="border-ink/30 flex w-[56px] shrink-0 flex-col items-center justify-center gap-1 border-r-2 border-dashed py-3">
                <Skeleton className="h-4 w-5" />
                <Skeleton className="h-2 w-6" />
              </div>
              <div className="flex flex-1 items-center justify-between px-3 py-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-10" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </div>
  );
}
