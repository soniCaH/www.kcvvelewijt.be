/**
 * Scheurkalender Page — Loading Skeleton
 * Matches the PageHero (compact, no image) + date-grouped upcoming matches layout.
 */

import { PageHero } from "@/components/layout/PageHero";

export default function ScheurkalenderLoading() {
  return (
    <div className="bg-cream min-h-screen">
      <div className="mx-auto max-w-5xl px-4 pt-10">
        <PageHero kicker="Kalender" headline="Scheurkalender" size="compact" />
      </div>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        {Array.from({ length: 4 }).map((_, day) => (
          <div key={day} className="animate-pulse">
            {/* Date header */}
            <div className="bg-paper-edge mb-3 h-5 w-40 rounded" />
            {/* Match rows */}
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, match) => (
                <div
                  key={match}
                  className="border-paper-edge bg-cream-soft flex items-center gap-4 border-2 p-3"
                >
                  <div className="bg-cream h-4 w-12 rounded" />
                  <div className="bg-cream h-4 w-20 rounded" />
                  <div className="flex flex-1 items-center gap-2">
                    <div className="bg-cream h-6 w-6 rounded-full" />
                    <div className="bg-cream h-4 w-24 rounded" />
                    <div className="bg-cream h-4 w-4 rounded" />
                    <div className="bg-cream h-6 w-6 rounded-full" />
                    <div className="bg-cream h-4 w-24 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
