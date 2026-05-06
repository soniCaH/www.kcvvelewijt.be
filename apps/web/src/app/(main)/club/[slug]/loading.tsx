/**
 * Club Page (Dynamic) — Loading Skeleton
 * Matches the InteriorPageHero + article body layout
 */

import { InteriorPageHero } from "@/components/layout/InteriorPageHero";

export default function ClubPageLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      <InteriorPageHero
        label="Club"
        headline="Laden..."
        body=""
        size="compact"
      />

      {/* Article body prose */}
      <div className="max-w-inner-lg mx-auto animate-pulse space-y-4 px-4 py-8">
        <div className="h-5 w-full rounded bg-gray-200" />
        <div className="h-5 w-full rounded bg-gray-200" />
        <div className="h-5 w-4/5 rounded bg-gray-200" />
        <div className="mt-6 h-48 w-full rounded-sm bg-gray-200" />
        <div className="mt-6 h-5 w-full rounded bg-gray-200" />
        <div className="h-5 w-full rounded bg-gray-200" />
        <div className="h-5 w-2/3 rounded bg-gray-200" />
      </div>
    </div>
  );
}
