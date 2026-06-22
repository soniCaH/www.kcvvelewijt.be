/**
 * Player Detail Page — Loading Skeleton (Phase 6.A).
 *
 * Mirrors the new `/spelers/[slug]` composition at the chrome level —
 * `<PlayerHero>` block, `<StripedSeam>`, and a bio paragraph footprint.
 * Subject-specific surfaces (photo, name, bio text, ink quote card) are
 * intentionally NOT skeletonised: their auto-hide branches mean a single
 * skeleton can't accurately predict what will render.
 */

import { PageContainer } from "@/components/design-system";

export default function PlayerDetailLoading() {
  return (
    <div className="min-h-screen" aria-hidden="true">
      <PageContainer as="section" className="animate-pulse py-12 lg:py-16">
        <div className="grid grid-cols-1 items-start gap-x-10 gap-y-8 sm:grid-cols-[1fr_minmax(220px,320px)]">
          <div className="flex flex-col gap-5">
            <div className="bg-paper-edge h-4 w-24 rounded" />
            <div className="bg-paper-edge h-24 w-32 rounded" />
            <div className="space-y-2">
              <div className="bg-paper-edge h-12 w-3/4 rounded" />
              <div className="bg-paper-edge h-10 w-2/3 rounded" />
            </div>
            <div className="bg-paper-edge h-3 w-48 rounded" />
            <div className="bg-paper-edge h-7 w-40 rounded" />
          </div>
          <div className="bg-paper-edge aspect-[3/4] w-full max-w-[320px] justify-self-start rounded sm:justify-self-end" />
        </div>
      </PageContainer>
      <div className="bg-paper-edge h-[18px] w-full" />
      <PageContainer
        as="section"
        className="bg-cream animate-pulse py-12 lg:py-16"
      >
        <div className="space-y-3">
          <div className="bg-paper-edge h-4 w-full rounded" />
          <div className="bg-paper-edge h-4 w-11/12 rounded" />
          <div className="bg-paper-edge h-4 w-10/12 rounded" />
        </div>
      </PageContainer>
    </div>
  );
}
