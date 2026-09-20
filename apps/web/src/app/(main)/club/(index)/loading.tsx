/**
 * `/club` index — loading skeleton.
 *
 * Next ships this file's fallback in the streamed HTML of every `/club/*`
 * child too (#2432 §1) — moving it into a route group that stops the leak
 * would also require relocating `page.tsx` into that group, which is
 * forbidden while another agent's branch is live on that path. Deferred; see
 * the PR body.
 *
 * Given the leak, this skeleton renders **no real heading text of any kind**
 * — not even `/club`'s own static kicker/headline — because a leaked
 * skeleton showing `/club`'s real "De plezantste compagnie" `<h1>` on
 * `/club/bestuur` is exactly the two-`<h1>` defect this ticket exists to
 * close (#2432 §2). `<PageHeroSkeleton register="band" tone="cream">`
 * composes the real `<TapedCard>` shell with shimmer bars only.
 */

import {
  PageContainer,
  StripedSeam,
  Skeleton,
  LoadingAnnouncement,
  TapedCardGrid,
} from "@/components/design-system";
import { PageHeroSkeleton } from "@/components/layout/PageHero";

export default function ClubLoading() {
  return (
    <div className="bg-cream min-h-screen">
      <LoadingAnnouncement label="Club laden…" />

      {/* Hero footprint — band · cream, bars only (no real heading; see
          docblock above). size="default" + lead matches the real page's
          <PageHero kicker="Onze club" headline="De plezantste compagnie"
          lead="..." /> call — no size/lead means the real card is padding
          "lg" with a lead bar, taller than the old hardcoded "md" shell. */}
      <PageContainer width="index" className="pt-10 pb-12">
        <PageHeroSkeleton register="band" tone="cream" size="default" lead />
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Editorial nav hub — header bar + the real `<TapedCardGrid columns={3}
          gap="sm">` footprint (12 cards, matching `<ClubEditorialHub>`'s
          `CLUB_HUB_CARDS`). The grid, not a hand-rolled `grid-cols-*` ladder,
          because it also sets `--taped-card-rotation` per slot — the same
          var `EditorialHubCard.tsx` reads via `rotate-[var(--taped-card-
          rotation,0deg)]` on arrival. Without both the grid AND that class
          on each skeleton card, all 12 sit flat and visibly snap to
          −1°…−6° when the real hub swaps in. */}
      <PageContainer width="index" className="py-12">
        <Skeleton className="mb-8 h-10 w-72 max-w-full" />
        <div data-testid="club-hub-skeleton">
          <TapedCardGrid columns={3} gap="sm">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="border-ink shadow-paper-sm bg-cream-soft flex h-full rotate-[var(--taped-card-rotation,0deg)] flex-col overflow-hidden border-2"
              >
                <div className="border-ink aspect-[16/9] border-b-2">
                  <Skeleton className="h-full w-full" />
                </div>
                <div className="flex flex-col gap-2 p-3.5">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </TapedCardGrid>
        </div>
      </PageContainer>
    </div>
  );
}
