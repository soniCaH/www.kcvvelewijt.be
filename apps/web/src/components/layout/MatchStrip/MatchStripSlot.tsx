import { Suspense } from "react";
import { MatchStrip } from "./MatchStrip";
import { MatchStripSkeleton } from "./MatchStripSkeleton";

/**
 * Suspense-wrapped slot for the next-fixture band. Mount on landing surfaces
 * (homepage + section indexes) immediately below the `<SiteHeader />`. Detail
 * pages omit this slot per spec.
 */
export function MatchStripSlot() {
  return (
    <Suspense fallback={<MatchStripSkeleton />}>
      <MatchStrip />
    </Suspense>
  );
}
