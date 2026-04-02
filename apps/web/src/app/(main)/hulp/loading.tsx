/**
 * Help / Responsibility Finder — Loading Skeleton
 * Matches the question-builder + contact results layout
 */

import { PageHero } from "@/components/design-system/PageHero";

export default function HelpLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      <PageHero label="Hulp" headline="Hulp nodig?" body="" size="compact" />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Question builder */}
        <div className="rounded-lg bg-white border border-gray-200 p-6 space-y-6 animate-pulse">
          <div className="h-6 w-48 rounded bg-gray-200" />
          {/* Dropdowns */}
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-16 rounded bg-gray-200" />
              <div className="h-10 w-full rounded bg-gray-200" />
            </div>
          ))}
          <div className="h-10 w-32 rounded bg-gray-200" />
        </div>

        {/* Results placeholder */}
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-sm bg-white border border-gray-200 shadow-sm p-4 flex items-center gap-4"
            >
              <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-gray-200" />
                <div className="h-3 w-24 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
