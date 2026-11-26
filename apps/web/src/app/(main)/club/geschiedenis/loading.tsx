/**
 * Geschiedenis Page — Loading Skeleton.
 *
 * Mirrors `HistoryContent` (`/club/geschiedenis`):
 *   <HeritageHero> (kicker + display headline + italic lead — fixed copy)
 *     → <StripedSeam>
 *     → alternating timeline items — paper TapedCards on a dashed centre line
 *
 * `<HeritageHero>` is a pure, server-renderable wrapper over the shared
 * opening with no data dependency, so per #2432 §2 this reuses it directly,
 * unshimmered, rather than redrawing its bars.
 *
 * Default width (1040). Canonical paper-register chrome only — `border-2
 * border-ink`, square corners, `cream-soft`/`paper-edge` fills, pulse bars.
 */

import {
  PageContainer,
  StripedSeam,
  Skeleton,
  LoadingAnnouncement,
} from "@/components/design-system";
import { HeritageHero } from "./HistoryTimeline";

/** A timeline TapedCard footprint on one side of the centre line. */
const TimelineItemSkeleton = ({ side }: { side: "left" | "right" }) => {
  const card = (
    <div className="border-ink bg-cream-soft shadow-paper-md space-y-3 border-2 p-5">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
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
};

const HistoryLoading = () => {
  return (
    <div className="min-h-screen">
      <LoadingAnnouncement label="Geschiedenis laden…" />

      <HeritageHero />

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Timeline — alternating paper cards on a dashed ink centre line. */}
      <PageContainer className="py-8">
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
};

export default HistoryLoading;
