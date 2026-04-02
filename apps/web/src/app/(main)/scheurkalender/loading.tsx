/**
 * Scheurkalender Page — Loading Skeleton
 * Matches the date-grouped upcoming matches layout
 */

import { PageHero } from "@/components/design-system/PageHero";

export default function ScheurkalenderLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      <PageHero
        label="Kalender"
        headline="Scheurkalender"
        body=""
        size="compact"
      />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {Array.from({ length: 4 }).map((_, day) => (
          <div key={day} className="animate-pulse">
            {/* Date header */}
            <div className="h-5 w-40 rounded bg-gray-300 mb-3" />
            {/* Match rows */}
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, match) => (
                <div
                  key={match}
                  className="flex items-center gap-4 rounded-sm bg-white border border-gray-200 shadow-sm p-3"
                >
                  <div className="h-4 w-12 rounded bg-gray-200" />
                  <div className="h-4 w-20 rounded bg-gray-200" />
                  <div className="flex items-center gap-2 flex-1">
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
