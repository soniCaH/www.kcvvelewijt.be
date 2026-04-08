/**
 * Sponsors Page — Loading Skeleton
 *
 * Uses the shared getSponsorsSections factory so the outer envelope (backgrounds,
 * padding, diagonal SectionTransitions) is identical to page.tsx. Only the
 * inner content per section is replaced with shimmer placeholders.
 */

import { SectionStack } from "@/components/design-system/SectionStack/SectionStack";
import { getSponsorsSections } from "@/components/sponsors/getSponsorsSections";

function HeaderSkeleton() {
  return (
    <div className="max-w-inner-lg mx-auto px-4 md:px-10 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-0.5 bg-white/10" />
        <div className="h-3 w-20 rounded bg-white/10" />
      </div>
      <div className="h-16 w-96 max-w-full rounded bg-white/10 mb-4" />
      <div className="h-5 w-80 max-w-full rounded bg-white/15" />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="max-w-inner-lg mx-auto px-4 md:px-10 py-10 space-y-8">
      {/* Gold tier */}
      <div className="animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/2] rounded-sm bg-gray-200 border border-gray-200"
            />
          ))}
        </div>
      </div>

      {/* Silver tier */}
      <div className="animate-pulse">
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/2] rounded-sm bg-gray-200 border border-gray-200"
            />
          ))}
        </div>
      </div>

      {/* Bronze tier */}
      <div className="animate-pulse">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/2] rounded-sm bg-gray-200 border border-gray-200"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CtaSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 text-center animate-pulse space-y-4 py-12">
      <div className="h-8 w-64 rounded bg-white/10 mx-auto" />
      <div className="h-5 w-96 max-w-full rounded bg-white/15 mx-auto" />
      <div className="h-10 w-32 rounded bg-white/10 mx-auto mt-4" />
    </div>
  );
}

export default function SponsorsLoading() {
  return (
    <SectionStack
      sections={getSponsorsSections({
        header: <HeaderSkeleton />,
        spotlight: false,
        grid: <GridSkeleton />,
        cta: <CtaSkeleton />,
      })}
    />
  );
}
