/**
 * Calendar Page — Loading Skeleton
 * Matches the PageHero + calendar widget layout.
 *
 * Note: Unlike /club and /ploegen, this skeleton does not use the SectionStack
 * factory pattern because the calendar page itself uses a flat layout
 * (PageHero + single content div) rather than SectionStack sections.
 */

import { PageHero } from "@/components/design-system/PageHero";

export default function CalendarLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      <PageHero
        label="Kalender"
        headline="Wedstrijdkalender"
        body="Bekijk alle wedstrijden en activiteiten van KCVV Elewijt."
        size="compact"
      />

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Matches CalendarWidget's root <div className="space-y-4"> */}
        <div className="space-y-4">
          {/* Top row: view toggle + subscribe button */}
          <div
            className="flex items-center justify-between gap-2"
            data-testid="calendar-skeleton-toolbar-top"
          >
            {/* View toggle — segmented control matching CalendarWidget */}
            <div
              className="inline-flex rounded-lg border border-gray-300 overflow-hidden animate-pulse"
              data-testid="calendar-skeleton-view-toggle"
            >
              <div className="px-4 py-2 w-20 h-[38px] bg-gray-200" />
              <div className="px-4 py-2 w-20 h-[38px] bg-gray-100 hidden md:inline-flex" />
            </div>

            {/* Subscribe button skeleton */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 h-[38px] w-32 rounded-lg border border-gray-300 bg-gray-100 animate-pulse"
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
                className={`${w} h-[42px] rounded border-2 border-gray-300 bg-gray-100 animate-pulse`}
                /* h-[42px] ≈ py-3 × 2 + text-sm line-height, matching FilterTabs medium size */
                data-testid="skeleton-pill"
              />
            ))}
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
    </div>
  );
}
