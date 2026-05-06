/**
 * Scheurkalender Page — Loading Skeleton
 * Matches the date-grouped upcoming matches layout
 */

import { InteriorPageHero } from "@/components/layout/InteriorPageHero";

export default function ScheurkalenderLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      <InteriorPageHero
        label="Kalender"
        headline="Scheurkalender"
        body=""
        size="compact"
      />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        {Array.from({ length: 4 }).map((_, day) => (
          <div key={day} className="animate-pulse">
            {/* Date header */}
            <div className="mb-3 h-5 w-40 rounded bg-gray-300" />
            {/* Match rows */}
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, match) => (
                <div
                  key={match}
                  className="flex items-center gap-4 rounded-sm border border-gray-200 bg-white p-3 shadow-sm"
                >
                  <div className="h-4 w-12 rounded bg-gray-200" />
                  <div className="h-4 w-20 rounded bg-gray-200" />
                  <div className="flex flex-1 items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-gray-200" />
                    <div className="h-4 w-24 rounded bg-gray-200" />
                    <div className="h-4 w-4 rounded bg-gray-200" />
                    <div className="h-6 w-6 rounded-full bg-gray-200" />
                    <div className="h-4 w-24 rounded bg-gray-200" />
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
