import { Suspense } from "react";
import { MatchStrip } from "./MatchStrip";
import { MatchStripSkeleton } from "./MatchStripSkeleton";

/**
 * Suspense-wrapped slot for the next-fixture band. Mounted only from layouts
 * (#3027): once for the landing surfaces (homepage + section indexes) via
 * `(landing)/layout.tsx`, and at the top of the three bespoke detail routes
 * (`/wedstrijd/[matchId]`, `/spelers/[slug]`, `/ploegen/[slug]`) via each
 * one's own segment layout. A layout sits outside its segment's
 * `loading.tsx`, so the real strip stays on screen while the page loads; a
 * `page.tsx` mount would need a stand-in there, and no stand-in can know the
 * strip's data-dependent height. `cross-page-consistency.test.ts` Rule 14
 * pins the four mounts.
 */
export function MatchStripSlot() {
  return (
    <Suspense fallback={<MatchStripSkeleton />}>
      <MatchStrip />
    </Suspense>
  );
}
