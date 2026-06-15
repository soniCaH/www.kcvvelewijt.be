/**
 * Club Page (Dynamic) — Loading Skeleton
 * Matches the PageHero (compact, no image) + article body layout.
 */

import { PageHero } from "@/components/layout/PageHero";

export default function ClubPageLoading() {
  return (
    <div className="bg-cream min-h-screen">
      <div className="mx-auto max-w-5xl px-4 pt-10">
        <PageHero kicker="Club" headline="Laden…" size="compact" />
      </div>

      {/* Article body prose */}
      <div className="max-w-inner-lg mx-auto animate-pulse space-y-4 px-4 py-8">
        <div className="bg-cream-soft h-5 w-full rounded" />
        <div className="bg-cream-soft h-5 w-full rounded" />
        <div className="bg-cream-soft h-5 w-4/5 rounded" />
        <div className="bg-cream-soft mt-6 h-48 w-full rounded-sm" />
        <div className="bg-cream-soft mt-6 h-5 w-full rounded" />
        <div className="bg-cream-soft h-5 w-full rounded" />
        <div className="bg-cream-soft h-5 w-2/3 rounded" />
      </div>
    </div>
  );
}
