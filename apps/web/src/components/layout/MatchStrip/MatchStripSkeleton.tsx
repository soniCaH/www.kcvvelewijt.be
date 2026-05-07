/**
 * Cream-paper skeleton matching the upcoming-state strip dimensions.
 * Rendered as the Suspense fallback while `getFirstTeamNextMatch()` resolves.
 */
export function MatchStripSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="bg-cream border-ink/15 min-h-[40px] border-t border-b motion-safe:animate-pulse lg:min-h-[48px]"
    >
      <div className="flex min-h-[40px] items-center justify-center gap-3 px-4 py-2 lg:min-h-[48px]">
        <div className="bg-ink/10 h-4 w-32 rounded-sm" />
        <div className="bg-ink/10 hidden h-3 w-48 rounded-sm lg:block" />
      </div>
    </div>
  );
}
