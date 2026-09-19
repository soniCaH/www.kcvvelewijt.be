/**
 * Event Detail Page — Loading Skeleton.
 *
 * Mirrors `EventDetailPage` (`/evenementen/[slug]`):
 *   <EventHero> (centred 680: type pill → date kicker → display title →
 *     location → CTAs → optional taped cover figure)
 *     → <RelatedRow> (full-bleed cream slider of w-72/w-80 cards, OUTSIDE
 *       the `<PageContainer>` the hero sits in)
 *
 * #2581 replaces the old in-container "Andere evenementen" heading + seam +
 * single-column `<TicketStub>` list (`<AndereEvents>`) with the shared
 * cross-route `<RelatedRow>`, which is full-bleed and moves the container
 * boundary. Matched here on the structural facts only — full-bleed outside
 * `PageContainer`, a horizontal row of card-width blocks, no "Andere
 * evenementen" heading — not #2581's exact card chrome, which is still
 * under review.
 *
 * The title is the event's own CMS title — data — so per #2432 §2 this
 * renders no heading text at all, bars only.
 *
 * Cream page; default container (1040) with the hero capped at 680. Canonical
 * paper-register chrome — `border-2 border-ink`, square corners, pulse bars.
 */

import {
  PageContainer,
  Skeleton,
  LoadingAnnouncement,
  UpLink,
} from "@/components/design-system";

export default function EventDetailLoading() {
  return (
    <div className="bg-cream">
      <LoadingAnnouncement label="Evenement laden…" />

      {/* Top air is `<UpLink>`'s own now (#2877) — this container keeps
          only its bottom padding. */}
      <PageContainer as="main" className="pb-12">
        {/* Real, unshimmered — its label is fixed copy, not data (review
            round 2, #2570). Always the container's left edge, even though
            EventHero itself is centred (#2442 rule 3). */}
        <UpLink href="/evenementen" label="Evenementen" className="mb-6" />

        {/* EventHero — centred 680 footprint. */}
        <article
          aria-hidden="true"
          className="mx-auto flex max-w-[var(--container-prose)] flex-col items-center gap-3 px-4 text-center"
        >
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-3 w-32" />
          <div className="mt-3 flex justify-center gap-3">
            <Skeleton className="h-11 w-36" />
            <Skeleton className="h-11 w-36" />
          </div>
          <div className="border-ink bg-cream-soft shadow-paper-md mt-6 aspect-[16/9] w-full border-2" />
        </article>
      </PageContainer>

      {/* RelatedRow — full-bleed cream band OUTSIDE PageContainer (matches
          RelatedRow.tsx's own root exactly: "bg-cream w-full px-4 pt-8
          pb-16 lg:pt-10 lg:pb-24"), a heading bar, then a horizontal row of
          w-72/md:w-80 card blocks. */}
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
