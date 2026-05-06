/**
 * Calendar Page — Loading Skeleton
 * Matches the InteriorPageHero + calendar widget layout.
 *
 * Note: Unlike /club and /ploegen, this skeleton does not use the SectionStack
 * factory pattern because the calendar page itself uses a flat layout
 * (InteriorPageHero + single content div) rather than SectionStack sections.
 */

import { InteriorPageHero } from "@/components/layout/InteriorPageHero";

export default function CalendarLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      <InteriorPageHero
        label="Kalender"
        headline="Wedstrijdkalender"
        body="Bekijk alle wedstrijden en activiteiten van KCVV Elewijt."
        size="compact"
      />

      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Matches CalendarWidget's root <div className="space-y-4"> */}
        <div className="space-y-4">
          {/* Top row: view toggle + subscribe button */}
          <div
            className="flex items-center justify-between gap-2"
            data-testid="calendar-skeleton-toolbar-top"
          >
            {/* View toggle — segmented control matching CalendarWidget */}
            <div
              className="inline-flex animate-pulse overflow-hidden rounded-lg border border-gray-300"
              data-testid="calendar-skeleton-view-toggle"
            >
              <div className="h-[38px] w-20 bg-gray-200 px-4 py-2" />
              <div className="hidden h-[38px] w-20 bg-gray-100 px-4 py-2 md:inline-flex" />
            </div>

            {/* Subscribe button skeleton */}
            <div
              className="inline-flex h-[38px] w-32 animate-pulse items-center gap-2 rounded-lg border border-gray-300 bg-gray-100 px-4 py-2"
              data-testid="calendar-skeleton-subscribe"
            />
          </div>

          {/* Team filter tabs — pill-shaped placeholders matching FilterTabs (md) */}
          <div
            className="flex gap-2"
            data-testid="calendar-skeleton-filter-tabs"
          >
            {["w-24", "w-20", "w-20", "w-24"].map((w, i) => (
              <div
                key={i}
                className={`${w} h-[42px] animate-pulse rounded border-2 border-gray-300 bg-gray-100`}
                /* h-[42px] ≈ py-3 × 2 + text-sm line-height, matching FilterTabs medium size */
                data-testid="skeleton-pill"
              />
            ))}
          </div>

          {/* Calendar grid skeleton — 7 columns mimicking a month view */}
          <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-4">
            {/* Day headers */}
            <div className="mb-3 grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-4 rounded bg-gray-200" />
              ))}
            </div>
            {/* Week rows */}
            {Array.from({ length: 5 }).map((_, week) => (
              <div key={week} className="mb-2 grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, day) => (
                  <div
                    key={day}
                    className="h-16 rounded border border-gray-200 bg-gray-100"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
