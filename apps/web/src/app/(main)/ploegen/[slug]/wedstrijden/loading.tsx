/**
 * Team Matches Page — Loading Skeleton.
 *
 * `force-dynamic` (`page.tsx`'s own `export const dynamic`), so this renders
 * on every request — the most-seen of the four skeletons #2642 covers, not
 * the least; the other three are ISR-cached and mostly show on soft
 * navigation. A skeleton draws only what it can know before the fetch: the
 * editorial header (up-link shimmer + "Wedstrijden." bars) is kept at full
 * fidelity, since only its up-link label is data (the team display name,
 * #2570) — the heading itself is fixed copy.
 *
 * The month bands below it are not knowable before the fetch: whether any
 * fixture exists at all (14 of 18 teams render "Nog geen wedstrijden
 * gepland" here) and how many months it spans both come from the PSD read
 * this fallback exists to cover. Neutral `paper-edge` bars replace them —
 * the same vocabulary the header shimmer already uses. A bare header over
 * empty cream was rejected (#2607): on this route it would be
 * indistinguishable from the fourteen teams that genuinely have no
 * fixtures, the precise confusion the empty-fixtures state exists to end.
 *
 * Default width (1040). Canonical paper-register chrome.
 */

import {
  PageContainer,
  SkeletonBars,
  LoadingAnnouncement,
} from "@/components/design-system";
import { PageHeroSkeleton } from "@/components/layout/PageHero";

export default function WedstrijdenLoading() {
  return (
    <div className="min-h-screen">
      <LoadingAnnouncement label="Wedstrijden laden…" />

      <PageContainer className="py-12 sm:py-16">
        {/* No kicker (the real hero has none — the up-link carries the team
            name instead, #2442 rule 6) and a shimmer stand-in for the
            up-link itself: unlike every other route's up-link label, this
            one *is* data (the team display name), so it cannot render real
            before the fetch resolves (review round 2, #2570). */}
        <PageHeroSkeleton register="minimal" kicker={false} upLinkShimmer />

        {/* Whether any fixture exists, and how many months it spans, is
            data (#2642). Neutral bars only. */}
        <SkeletonBars />
      </PageContainer>
    </div>
  );
}
