/**
 * Geschiedenis Page — Loading Skeleton.
 *
 * Mirrors `HistoryContent` (`/club/geschiedenis`):
 *   <HeritageHero> (kicker + display headline + italic lead)
 *     → <StripedSeam>
 *     → alternating timeline items — paper TapedCards on a dashed centre line
 *
 * Default width (1040). Canonical paper-register chrome only — `border-2
 * border-ink`, square corners, `cream-soft`/`paper-edge` fills, pulse bars.
 */

import { PageContainer, StripedSeam } from "@/components/design-system";

/** A timeline TapedCard footprint on one side of the centre line. */
function TimelineItemSkeleton({ side }: { side: "left" | "right" }) {
  const card = (
    <div className="border-ink bg-cream-soft shadow-paper-md space-y-3 border-2 p-5">
      <div className="bg-paper-edge h-5 w-28" />
      <div className="bg-paper-edge h-3 w-full" />
      <div className="bg-paper-edge h-3 w-full" />
      <div className="bg-paper-edge h-3 w-3/4" />
    </div>
  );
  return (
    <div className="relative mb-10 md:flex md:items-start md:justify-between">
      <div
        className={`w-full md:w-[45%] ${side === "right" ? "hidden md:invisible md:block" : ""}`}
      >
        {side === "left" && card}
      </div>
      <div
        className={`w-full md:w-[45%] ${side === "left" ? "hidden md:invisible md:block" : ""}`}
      >
        {side === "right" && card}
      </div>
    </div>
  );
}

export default function HistoryLoading() {
  return (
    <div className="min-h-screen">
      <span
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="sr-only"
      >
        Geschiedenis laden...
      </span>

      {/* HeritageHero — kicker + display headline + italic lead. */}
      <PageContainer
        as="header"
        className="flex flex-col gap-3 pt-10 motion-safe:animate-pulse sm:pt-14"
        aria-hidden="true"
      >
        <div className="bg-paper-edge h-3 w-40" />
        <div className="bg-paper-edge h-12 w-2/3" />
        <div className="bg-paper-edge h-5 w-3/4" />
      </PageContainer>

      <div className="mt-8">
        <StripedSeam colorPair="ink-cream" height="md" />
      </div>

      {/* Timeline — alternating paper cards on a dashed ink centre line. */}
      <PageContainer className="py-8 motion-safe:animate-pulse">
        <div className="relative py-4">
          <div
            className="border-ink/50 pointer-events-none absolute inset-y-0 left-1/2 hidden -translate-x-px border-l-2 border-dashed md:block"
            aria-hidden="true"
          />
          {(["left", "right", "left", "right"] as const).map((side, i) => (
            <TimelineItemSkeleton key={i} side={side} />
          ))}
        </div>
      </PageContainer>
    </div>
  );
}
