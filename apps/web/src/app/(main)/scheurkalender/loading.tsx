/**
 * Scheurkalender Page — Loading Skeleton
 * Mirrors the Treatment A sheet: masthead bar + weekend fixture rows.
 */

import { PageContainer } from "@/components/design-system";

export default function ScheurkalenderLoading() {
  return (
    <div className="bg-cream min-h-screen">
      <PageContainer className="pt-12 pb-12">
        <div className="border-ink border-2 bg-white">
          {/* Masthead */}
          <div className="border-ink flex items-baseline justify-between gap-4 border-b-2 px-4 py-3.5">
            <div className="bg-ink/10 h-4 w-56 animate-pulse rounded" />
            <div className="bg-ink/10 h-3 w-32 animate-pulse rounded" />
          </div>
          {/* Fixture rows */}
          <div className="divide-ink/10 divide-y">
            {Array.from({ length: 8 }).map((_, row) => (
              <div key={row} className="flex items-center gap-4 px-2.5 py-2">
                <div className="bg-ink/10 h-3 w-16 animate-pulse rounded" />
                <div className="bg-ink/10 h-3 w-10 animate-pulse rounded" />
                <div className="bg-ink/10 h-3 flex-1 animate-pulse rounded" />
                <div className="bg-ink/10 h-3 flex-1 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
