/**
 * Youth Academy Page — Loading Skeleton
 *
 * Uses the shared getJeugdSections factory so the outer envelope (backgrounds,
 * padding, diagonal SectionTransitions) is identical to page.tsx. Only the
 * inner content per section is replaced with shimmer placeholders.
 */

import { SectionStack } from "@/components/design-system/SectionStack/SectionStack";
import { getJeugdSections } from "./getJeugdSections";

function EditorialSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 aspect-[4/3] rounded-sm bg-gray-200 md:col-span-7" />
        <div className="col-span-12 space-y-4 md:col-span-5">
          <div className="aspect-[4/3] rounded-sm bg-gray-200" />
          <div className="aspect-[4/3] rounded-sm bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

function TeamsSkeleton() {
  return (
    <div className="mx-auto max-w-[70rem] animate-pulse space-y-8 px-4 md:px-10">
      <div className="h-8 w-40 rounded bg-white/10" />
      {Array.from({ length: 3 }).map((_, div) => (
        <div key={div} className="space-y-4">
          <div className="h-6 w-28 rounded bg-white/10" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-sm bg-white/10" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function QuoteSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-4 px-4 text-center">
      <div className="mx-auto h-6 w-12 rounded bg-white/10" />
      <div className="mx-auto h-8 w-80 max-w-full rounded bg-white/10" />
      <div className="mx-auto h-4 w-48 rounded bg-white/15" />
    </div>
  );
}

function CtaSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-4 px-4 text-center">
      <div className="mx-auto h-8 w-64 rounded bg-gray-200" />
      <div className="mx-auto h-5 w-96 max-w-full rounded bg-gray-200" />
      <div className="mx-auto mt-4 h-10 w-32 rounded bg-gray-200" />
    </div>
  );
}

export default function JeugdLoading() {
  return (
    <SectionStack
      sections={getJeugdSections({
        editorial: <EditorialSkeleton />,
        teams: <TeamsSkeleton />,
        quote: <QuoteSkeleton />,
        cta: <CtaSkeleton />,
      })}
    />
  );
}
