/**
 * Event Detail Page — Loading Skeleton.
 *
 * Mirrors `EventDetailPage` (`/evenementen/[slug]`):
 *   <EventHero> (centred 680: type pill → date kicker → display title →
 *     location → CTAs → optional taped cover figure)
 *     → <AndereEvents> ("Andere events" heading + seam + single-column
 *       full-width `<TicketStub>` list)
 *
 * Cream page; default container (1040) with the hero capped at 680. Canonical
 * paper-register chrome — `border-2 border-ink`, square corners, pulse bars.
 */

import { PageContainer, StripedSeam } from "@/components/design-system";

export default function EventDetailLoading() {
  return (
    <div className="bg-cream">
      <span
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="sr-only"
      >
        Evenement laden...
      </span>

      <PageContainer as="main" className="py-12">
        {/* EventHero — centred 680 footprint. */}
        <article
          aria-hidden="true"
          className="mx-auto flex max-w-[680px] flex-col items-center gap-3 px-4 text-center motion-safe:animate-pulse"
        >
          <div className="bg-paper-edge h-6 w-28" />
          <div className="bg-paper-edge h-3 w-40" />
          <div className="bg-paper-edge h-10 w-3/4" />
          <div className="bg-paper-edge h-3 w-32" />
          <div className="mt-3 flex justify-center gap-3">
            <div className="bg-paper-edge h-11 w-36" />
            <div className="bg-paper-edge h-11 w-36" />
          </div>
          <div className="border-ink bg-cream-soft shadow-paper-md mt-6 aspect-[16/9] w-full border-2" />
        </article>

        {/* Andere events — heading + seam + single-column ticket list. */}
        <section aria-hidden="true" className="mt-16 motion-safe:animate-pulse">
          <div className="mb-5">
            <div className="bg-paper-edge mb-4 h-8 w-48" />
            <StripedSeam height="sm" colorPair="ink-cream" />
          </div>
          <ul className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <li
                key={i}
                className="border-ink bg-cream shadow-paper-sm flex items-stretch border-2"
              >
                <div className="border-ink flex w-[72px] shrink-0 flex-col items-center justify-center gap-1 border-r-2 border-dashed py-4">
                  <div className="bg-paper-edge h-6 w-8" />
                  <div className="bg-paper-edge h-2 w-10" />
                </div>
                <div className="flex flex-1 flex-col justify-center gap-2 px-4 py-4">
                  <div className="bg-paper-edge h-4 w-1/2" />
                  <div className="bg-paper-edge h-3 w-2/3" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </PageContainer>
    </div>
  );
}
