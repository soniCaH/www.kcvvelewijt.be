/**
 * Team Matches Page — Loading Skeleton.
 *
 * Mirrors `WedstrijdenPage` (`/ploegen/[slug]/wedstrijden`):
 *   editorial header (mono team kicker + "Wedstrijden." display heading)
 *     → month-band sections (display-big month heading + `<TeamAgendaRow>`
 *       agenda rows)
 *
 * Default width (1040). Canonical paper-register chrome — `border-2
 * border-ink`, square corners, `cream`/`paper-edge` fills, pulse bars.
 */

import { PageContainer } from "@/components/design-system";

export default function WedstrijdenLoading() {
  return (
    <div className="min-h-screen">
      <span
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="sr-only"
      >
        Wedstrijden laden...
      </span>

      <PageContainer className="py-8 motion-safe:animate-pulse sm:py-12">
        {/* Editorial header — mono kicker + display heading. */}
        <div className="mb-8">
          <div className="bg-paper-edge h-3 w-40" />
          <div className="bg-paper-edge mt-3 h-12 w-64" />
        </div>

        {/* Month bands — display-big heading + agenda rows. */}
        <div className="flex flex-col gap-10">
          {Array.from({ length: 2 }).map((_, m) => (
            <section key={m}>
              <div className="bg-paper-edge mb-4 h-12 w-48" />
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="border-ink bg-cream shadow-paper-sm flex items-center gap-4 border-2 px-4 py-3"
                  >
                    <div className="bg-paper-edge h-4 w-16 shrink-0" />
                    <div className="bg-paper-edge h-4 flex-1" />
                    <div className="bg-paper-edge h-5 w-10 shrink-0" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </PageContainer>
    </div>
  );
}
