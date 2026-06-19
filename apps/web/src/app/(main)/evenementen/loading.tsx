/**
 * Events List Page — Loading Skeleton.
 *
 * Mirrors `EvenementenPage` (`/evenementen`):
 *   jersey-deep-dark header band (mono kicker + display headline)
 *     → <EventsBrowser>: colour-coded filter chip row above a single-column,
 *       month-grouped `<TicketStub>` list (each month: display heading + seam
 *       rule + ticket rows)
 *
 * Index width (1280) on the dark field. Placeholder bars use translucent cream
 * fills (on-dark equivalent of `paper-edge`); chips/tickets keep square corners
 * and ink/cream borders.
 */

import { PageContainer, StripedSeam } from "@/components/design-system";

export default function EvenementenLoading() {
  return (
    <div className="bg-jersey-deep-dark flex min-h-screen flex-col">
      <span
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="sr-only"
      >
        Evenementen laden...
      </span>

      {/* Header band — mono kicker + display headline. */}
      <PageContainer
        as="header"
        width="index"
        className="pt-12 pb-8 motion-safe:animate-pulse"
        aria-hidden="true"
      >
        <div className="bg-cream/20 h-3 w-44" />
        <div className="bg-cream/25 mt-2 h-12 w-72 max-w-full" />
      </PageContainer>

      <PageContainer width="index" className="flex-1 pb-16">
        <div className="flex flex-col gap-8 motion-safe:animate-pulse">
          {/* Filter chip row. */}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="border-cream/40 bg-cream/10 h-9 w-24 border-2"
              />
            ))}
          </div>

          {/* Month-grouped ticket list. */}
          <div className="flex flex-col gap-12">
            {Array.from({ length: 2 }).map((_, m) => (
              <section key={m}>
                <div className="bg-cream/25 mb-4 h-9 w-48" />
                <StripedSeam colorPair="cream-jersey-deep" height="sm" />
                <ul className="mt-4 flex flex-col gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <li
                      key={i}
                      className="border-cream/40 bg-cream/5 flex items-stretch border-2"
                    >
                      <div className="border-cream/40 flex w-[72px] shrink-0 flex-col items-center justify-center gap-1 border-r-2 border-dashed py-4">
                        <div className="bg-cream/20 h-6 w-8" />
                        <div className="bg-cream/15 h-2 w-10" />
                      </div>
                      <div className="flex flex-1 flex-col justify-center gap-2 px-4 py-4">
                        <div className="bg-cream/20 h-4 w-1/2" />
                        <div className="bg-cream/15 h-3 w-2/3" />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
