/**
 * Teams Landing Page — Loading Skeleton
 *
 * Uses the shared getPloegenSections factory so the outer envelope (backgrounds,
 * padding, diagonal SectionTransitions) is identical to page.tsx. Only the
 * inner content per section is replaced with shimmer placeholders.
 */

import { SectionStack } from "@/components/design-system/SectionStack/SectionStack";
import { getPloegenSections } from "./getPloegenSections";

function HeroSkeleton() {
  return (
    <div className="relative h-[70vh] min-h-[500px] animate-pulse">
      <div className="absolute inset-0 bg-gray-800" />
      <div className="absolute right-0 bottom-0 left-0 z-10 p-8 md:p-12">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="h-12 w-72 rounded bg-white/10" />
          <div className="h-5 w-48 rounded bg-white/15" />
          <div className="mt-4 h-10 w-40 rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function FeaturedCardSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      <div className="grid animate-pulse grid-cols-1 items-center gap-8 md:grid-cols-2">
        <div className="aspect-[4/3] rounded-sm bg-gray-200" />
        <div className="space-y-4">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-5 w-64 rounded bg-gray-200" />
          <div className="mt-2 h-10 w-36 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

function YouthDirectorySkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-8 px-4">
      <div className="h-8 w-48 rounded bg-white/10" />
      {Array.from({ length: 3 }).map((_, div) => (
        <div key={div} className="space-y-4">
          <div className="h-6 w-32 rounded bg-white/10" />
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

function CtaSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-4 px-4 text-center">
      <div className="mx-auto h-8 w-64 rounded bg-gray-200" />
      <div className="mx-auto h-5 w-96 max-w-full rounded bg-gray-200" />
      <div className="mx-auto mt-4 h-10 w-32 rounded bg-gray-200" />
    </div>
  );
}

export default function TeamsLoading() {
  return (
    <SectionStack
      sections={getPloegenSections({
        hero: <HeroSkeleton />,
        featured: <FeaturedCardSkeleton />,
        youth: <YouthDirectorySkeleton />,
        cta: <CtaSkeleton />,
      })}
    />
  );
}
