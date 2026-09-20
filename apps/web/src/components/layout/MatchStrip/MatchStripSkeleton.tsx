/**
 * Cream-paper skeleton matching the upcoming-state strip dimensions.
 * Rendered as the Suspense fallback while `getFirstTeamStripData()` resolves.
 *
 * `min-h-[40px]` (48px from `lg`) is a single fixed reservation; the real
 * strip's height is data-dependent and this cannot be clairvoyant about it
 * (`loading.tsx` never sees the fetch — same #2642 rule the detail-route
 * skeletons that mount this follow). It matches exactly when the resolved
 * strip renders one row (only a result or only a fixture); the common
 * in-season mobile case renders both as two stacked rows (~80px) and the
 * no-fixture case renders zero DOM (`<MatchStrip>` returns `null`) — both
 * are a known, deliberately unclosed residual shift — see #3027. A fixed
 * two-row mobile footprint here would fix the common case but still
 * over-reserve the empty-season one, and would also change the `(landing)`
 * route group's own loading state, which is a bigger change than a single
 * reservation height; #3027 proposes a stable reserved band on
 * `<MatchStripSlot>` itself instead.
 */
export function MatchStripSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="bg-cream border-ink/15 min-h-[40px] border-t border-b motion-safe:animate-pulse lg:min-h-[48px]"
    >
      <div className="flex min-h-[40px] items-center justify-center gap-3 px-4 py-2 lg:min-h-[48px]">
        <div className="bg-ink/10 h-4 w-32" />
        <div className="bg-ink/10 hidden h-3 w-48 lg:block" />
      </div>
    </div>
  );
}
