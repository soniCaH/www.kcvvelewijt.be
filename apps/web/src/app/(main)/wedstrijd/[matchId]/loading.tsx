/**
 * Match Detail Page — Loading Skeleton.
 *
 * Matches the Phase 6.B composition (page-composition-locked.md, 6.B.d1):
 * cream-on-paper hero + two section skeletons (lineup grid + events
 * timeline). Light theme to avoid the dark-bg flash that the legacy
 * MatchDetailView skeleton produced during navigation.
 */

export default function MatchDetailLoading() {
  // `min-h-screen` root preserved per the envelope-drift guard in
  // `apps/web/src/app/__tests__/loading-envelope.test.tsx` — non-SectionStack
  // routes pin to a contract root className.
  return (
    <div className="min-h-screen">
      {/* ── MatchHero skeleton — single TapedCard with stub + body ───── */}
      <section
        aria-hidden="true"
        className="bg-cream-soft mx-auto w-full max-w-[var(--container-wide)] px-4 py-8"
      >
        <div className="border-ink bg-cream shadow-paper-md grid grid-cols-1 border-2 md:grid-cols-[110px_1fr]">
          {/* Stub */}
          <div className="bg-cream-soft border-ink space-y-2 border-b-2 border-dashed p-5 md:border-r-2 md:border-b-0">
            <div className="bg-cream-deep h-6 w-16 animate-pulse" />
            <div className="bg-cream-deep h-6 w-12 animate-pulse" />
            <div className="bg-cream-deep h-4 w-10 animate-pulse" />
            <div className="bg-cream-deep h-3 w-16 animate-pulse" />
          </div>
          {/* Body */}
          <div className="flex flex-col gap-6 p-5 md:p-6">
            <div className="bg-cream-soft h-3 w-32 animate-pulse" />
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-cream-deep h-10 w-10 animate-pulse rounded-full" />
                <div className="bg-cream-deep h-5 w-32 animate-pulse" />
              </div>
              <div className="bg-cream-deep h-8 w-16 animate-pulse" />
              <div className="flex flex-row-reverse items-center gap-3">
                <div className="bg-cream-deep h-10 w-10 animate-pulse rounded-full" />
                <div className="bg-cream-deep h-5 w-32 animate-pulse" />
              </div>
            </div>
            <div className="border-ink border-t pt-3">
              <div className="bg-cream-soft h-3 w-48 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* ── MatchLineupSection skeleton — kicker + heading + 2-col rows ─ */}
      <section
        aria-hidden="true"
        className="bg-cream mx-auto w-full max-w-[var(--container-wide)] px-4 py-10 md:py-14"
      >
        <div className="bg-cream-soft mb-3 h-3 w-32 animate-pulse" />
        <div className="bg-cream-soft mb-10 h-8 w-64 animate-pulse" />
        <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, col) => (
            <div key={col}>
              <div className="border-ink mb-3 border-t pt-2">
                <div className="bg-cream-soft h-3 w-24 animate-pulse" />
              </div>
              <div className="space-y-2">
                {Array.from({ length: 11 }).map((_, row) => (
                  <div key={row} className="flex items-center gap-3 py-1.5">
                    <div className="bg-cream-soft h-7 w-7 animate-pulse" />
                    <div className="bg-cream-soft h-4 flex-1 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
