/**
 * Cream-paper skeleton matching the upcoming-state strip dimensions.
 * Rendered as `<MatchStripSlot>`'s Suspense fallback while
 * `getFirstTeamStripData()` resolves — only that; no `loading.tsx` draws it
 * (#3027), because the slot is layout-mounted and outlives page loading.
 *
 * `min-h-[40px]` (48px from `lg`) is one fixed reservation against a
 * data-dependent strip: exact for one row, short for the two stacked mobile
 * rows, and over for the zero-DOM no-fixture case. It shows on any streamed
 * render while the strip's read is in flight — `getFirstTeamStripData()` is
 * per-request `cache()` only, no TTL. An ISR-served page arrives complete.
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
