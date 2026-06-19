/**
 * Opponent History Page — Loading Skeleton
 *
 * Paper-register skeleton mirroring the #2141 reskin: a light hero card, the
 * five-cell summary, a striped seam, and a season-grouped row placeholder.
 * Card chrome (borders + paper shadow) stays solid; only the gray content bars
 * pulse.
 */

import { PageContainer, StripedSeam } from "@/components/design-system";

export default function OpponentLoading() {
  return (
    <div className="bg-cream-deep min-h-screen">
      <PageContainer className="pt-8 pb-8">
        {/* Hero card */}
        <div className="border-ink bg-cream shadow-paper-md border-2 p-6">
          <div className="animate-pulse">
            <div className="flex items-center gap-4">
              <div className="bg-ink/10 h-16 w-16 shrink-0 rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="bg-ink/10 h-3 w-40" />
                <div className="bg-ink/15 h-9 w-2/3" />
              </div>
            </div>
            <div className="bg-ink/10 mt-4 h-3 w-3/4" />
          </div>
        </div>

        {/* W/D/L summary */}
        <div className="border-ink bg-cream shadow-paper-sm mt-7 grid grid-cols-5 border-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="border-ink flex animate-pulse flex-col items-center gap-2 border-r-2 px-1.5 py-4 last:border-r-0"
            >
              <div className="bg-ink/15 h-6 w-6" />
              <div className="bg-ink/10 h-2 w-6" />
            </div>
          ))}
        </div>

        {/* Seam */}
        <div className="mt-8 mb-5">
          <StripedSeam height="sm" />
        </div>

        {/* List header */}
        <div className="bg-ink/15 mb-4 h-6 w-44 animate-pulse" />

        {/* Season band */}
        <div className="mb-2.5 flex animate-pulse items-center gap-2.5">
          <div className="bg-ink/15 h-5 w-28" />
          <div className="border-ink/30 h-0 flex-1 border-t-2 border-dotted" />
          <div className="bg-ink/10 h-2 w-16" />
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="border-ink bg-cream flex items-stretch border-2 shadow-[2px_2px_0_0_var(--color-ink)]"
            >
              <div className="border-ink/30 flex w-[56px] shrink-0 animate-pulse flex-col items-center justify-center gap-1 border-r-2 border-dashed py-3">
                <div className="bg-ink/15 h-4 w-5" />
                <div className="bg-ink/10 h-2 w-6" />
              </div>
              <div className="flex flex-1 animate-pulse items-center justify-between px-3 py-3">
                <div className="bg-ink/10 h-3 w-24" />
                <div className="bg-ink/15 h-5 w-10" />
                <div className="bg-ink/10 h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </div>
  );
}
