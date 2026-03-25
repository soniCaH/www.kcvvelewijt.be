/**
 * Events Page
 * Upcoming club events from Sanity
 */

import type { Metadata } from "next";
import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import {
  EventRepository,
  type EventVM,
} from "@/lib/repositories/event.repository";
import { EventsList, type EventsListItem } from "@/components/event/EventsList";

export const metadata: Metadata = {
  title: "Evenementen | KCVV Elewijt",
  description:
    "Bekijk alle aankomende evenementen van KCVV Elewijt — clubactiviteiten, jeugdevents en meer.",
  keywords: ["evenementen", "activiteiten", "club", "jeugd", "KCVV Elewijt"],
  openGraph: {
    title: "Evenementen - KCVV Elewijt",
    description: "Alle aankomende evenementen van KCVV Elewijt",
    type: "website",
  },
};

export const revalidate = 300;

function toEventsListItem(event: EventVM): EventsListItem {
  return {
    title: event.title,
    href: event.href,
    date: new Date(event.dateStart),
    endDate: event.dateEnd ? new Date(event.dateEnd) : undefined,
    imageUrl: event.coverImageUrl,
  };
}

export default async function EventsPage() {
  const events = await runPromise(
    Effect.gen(function* () {
      const repo = yield* EventRepository;
      return yield* repo.findAll();
    }).pipe(
      Effect.catchAll((error) => {
        console.error("[Events] Failed to fetch events:", error);
        return Effect.succeed([] as EventVM[]);
      }),
    ),
  );

  const upcomingEvents = events
    .filter((e) => new Date(e.dateStart) >= new Date())
    .map(toEventsListItem);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-white">
      {/* Hero */}
      <div className="bg-linear-to-br from-green-main via-green-hover to-green-dark-hover text-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 font-title">
            Evenementen
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl">
            Alle aankomende activiteiten van KCVV Elewijt
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <EventsList events={upcomingEvents} />
      </div>
    </div>
  );
}
