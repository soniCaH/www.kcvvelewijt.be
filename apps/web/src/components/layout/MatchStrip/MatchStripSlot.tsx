import { Suspense } from "react";
import { MatchStrip } from "./MatchStrip";
import { MatchStripSkeleton } from "./MatchStripSkeleton";

/**
 * Suspense-wrapped slot for the next-fixture band. Mounted on landing
 * surfaces (homepage + section indexes) immediately below the
 * `<SiteHeader />` via `(landing)/layout.tsx`, and inline at the top of the
 * three bespoke detail routes (`/wedstrijd/[matchId]`, `/spelers/[slug]`,
 * `/ploegen/[slug]`) that each render their own hero rather than the shared
 * `<PageHero>` — see each page's own docblock for why. Their `loading.tsx`
 * skeletons render this slot's fallback, `<MatchStripSkeleton />`, directly
 * at the same position (#3023): a layout-mounted `<MatchStripSlot>` persists
 * across its group's loading state on its own, but an inline one does not.
 */
export function MatchStripSlot() {
  return (
    <Suspense fallback={<MatchStripSkeleton />}>
      <MatchStrip />
    </Suspense>
  );
}
