/**
 * Calendar Page — Loading Skeleton
 * Matches the PageTitle + calendar widget layout
 */

import { PageTitle } from "@/components/layout";

export default function CalendarLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      <PageTitle title="Wedstrijdkalender" />

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Toolbar skeleton: view toggle + team filter */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex gap-1 rounded-lg bg-gray-200 p-1 animate-pulse">
            <div className="h-8 w-20 rounded-md bg-gray-300" />
            <div className="h-8 w-20 rounded-md bg-gray-200" />
          </div>
          <div className="h-8 w-32 rounded bg-gray-200 animate-pulse" />
        </div>

        {/* Calendar grid skeleton — 7 columns mimicking a month view */}
        <div className="rounded-lg bg-white border border-gray-200 p-4 animate-pulse">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded" />
            ))}
          </div>
          {/* Week rows */}
          {Array.from({ length: 5 }).map((_, week) => (
            <div key={week} className="grid grid-cols-7 gap-2 mb-2">
              {Array.from({ length: 7 }).map((_, day) => (
                <div
                  key={day}
                  className="h-16 bg-gray-100 rounded border border-gray-200"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
