/**
 * Events list page (`/evenementen`).
 *
 * Renders the upcoming-only `EventRepository.findUpcomingForList()` feed — the
 * merge of `event` docs and `articleType:event` articles (#1968) — as a
 * single-column, month-grouped list of `<TicketStub>` with colour-coded filter
 * chips (#1965 + #1966) on a dark `jersey-deep-dark` field (design lock 6e §2).
 * Event-doc tickets link to `/evenementen/[slug]`, article tickets to
 * `/nieuws/[slug]` (the repo resolves each item's `href`). The `(main)` group
 * hosts both this list and the `/evenementen/[slug]` detail; `/events/*` 301s
 * here (see `next.config.ts`).
 *
 * The filter chips, empty / filtered-to-zero states, and analytics live in the
 * `<EventsBrowser>` client shell; this server page only fetches the feed.
 */

import type { Metadata } from "next";
import { Effect } from "effect";

import { DEFAULT_OG_IMAGE } from "@/lib/constants";
import { runPromise } from "@/lib/effect/runtime";
import { EventRepository } from "@/lib/repositories/event.repository";
import { EditorialHeading, MonoLabel } from "@/components/design-system";
import { EventsBrowser } from "@/components/event/EventsBrowser";

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
      return yield* repo.findUpcomingForList();
    }),
  );

  return (
    <div className="bg-jersey-deep-dark flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-3xl px-4 pt-12 pb-8">
        <MonoLabel tone="cream">KCVV Elewijt · Agenda</MonoLabel>
        <EditorialHeading
          level={1}
          size="display-xl"
          tone="cream"
          className="mt-2"
        >
          Evenementen
        </EditorialHeading>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16">
        <EventsBrowser events={events} />
      </main>
    </div>
  );
}
