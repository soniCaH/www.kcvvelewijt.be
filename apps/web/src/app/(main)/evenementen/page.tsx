/**
 * Events list page (`/evenementen`).
 *
 * Tracer (#1964): renders the upcoming-only `EventRepository.findAll()` feed as
 * a minimal single column of bare `<TicketStub>`. Month grouping (#1965),
 * colour-coded filter chips (#1966) and the editorial dark-field header arrive
 * in later Phase 6.E issues. The `(main)` group hosts both this list and the
 * `/evenementen/[slug]` detail; `/events/*` 301s here (see `next.config.ts`).
 */

import type { Metadata } from "next";
import { Effect } from "effect";

import { DEFAULT_OG_IMAGE } from "@/lib/constants";
import { runPromise } from "@/lib/effect/runtime";
import { EventRepository } from "@/lib/repositories/event.repository";
import { EditorialHeading, MonoLabel } from "@/components/design-system";
import { TicketStub } from "@/components/event/TicketStub";

export const metadata: Metadata = {
  title: "Evenementen | KCVV Elewijt",
  description:
    "Alle aankomende evenementen van KCVV Elewijt — clubactiviteiten, jeugdevenementen en supportersuitjes.",
  keywords: [
    "evenementen",
    "agenda",
    "activiteiten",
    "club",
    "jeugd",
    "KCVV Elewijt",
  ],
  openGraph: {
    title: "Evenementen - KCVV Elewijt",
    description: "Alle aankomende evenementen van KCVV Elewijt",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
};

export const revalidate = 300;

export default async function EvenementenPage() {
  const events = await runPromise(
    Effect.gen(function* () {
      const repo = yield* EventRepository;
      return yield* repo.findAll();
    }),
  );

  return (
    <div className="bg-cream min-h-screen pb-[var(--footer-diagonal)]">
      <header className="mx-auto max-w-3xl px-4 pt-12 pb-8">
        <MonoLabel tone="ink">KCVV Elewijt · Agenda</MonoLabel>
        <EditorialHeading level={1} size="display-xl" className="mt-2">
          Evenementen
        </EditorialHeading>
      </header>

      <main className="mx-auto max-w-3xl px-4">
        {events.length === 0 ? (
          <p className="font-display text-ink text-xl">
            Geen evenementen gepland — kom snel terug.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {events.map((event) => (
              <li key={event.id}>
                <TicketStub
                  title={event.title}
                  href={`/evenementen/${event.slug}`}
                  dateStart={event.dateStart}
                  eventType={event.eventType}
                  location={event.location}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
