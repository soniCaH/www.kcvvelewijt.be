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
    <div className="max-w-inner-lg mx-auto animate-pulse px-4 md:px-10">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-0.5 w-5 bg-white/10" />
        <div className="h-3 w-20 rounded bg-white/10" />
      </div>
      <div className="mb-4 h-16 w-96 max-w-full rounded bg-white/10" />
      <div className="h-5 w-80 max-w-full rounded bg-white/15" />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="max-w-inner-lg mx-auto space-y-8 px-4 py-10 md:px-10">
      {/* Gold tier */}
      <div className="animate-pulse">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/2] rounded-sm border border-gray-200 bg-gray-200"
            />
          ))}
        </div>
      </div>

      {/* Silver tier */}
      <div className="animate-pulse">
        <div className="grid grid-cols-3 gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/2] rounded-sm border border-gray-200 bg-gray-200"
            />
          ))}
        </div>
      </div>

      {/* Bronze tier */}
      <div className="animate-pulse">
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/2] rounded-sm border border-gray-200 bg-gray-200"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CtaSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-4 px-4 py-12 text-center">
      <div className="mx-auto h-8 w-64 rounded bg-white/10" />
      <div className="mx-auto h-5 w-96 max-w-full rounded bg-white/15" />
      <div className="mx-auto mt-4 h-10 w-32 rounded bg-white/10" />
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
