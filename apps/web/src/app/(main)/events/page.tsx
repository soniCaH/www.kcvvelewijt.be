/**
 * Events Page
 * Upcoming club events from Sanity
 */

import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/constants";
import Link from "next/link";
import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import {
  EventRepository,
  type EventVM,
} from "@/lib/repositories/event.repository";
import { EventsList, type EventsListItem } from "@/components/event/EventsList";
import { Calendar, Newspaper, CalendarDays } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Evenementen | KCVV Elewijt",
  description:
    "Bekijk alle aankomende evenementen van KCVV Elewijt — clubactiviteiten, jeugdevents en meer.",
  keywords: ["evenementen", "activiteiten", "club", "jeugd", "KCVV Elewijt"],
  openGraph: {
    title: "Evenementen - KCVV Elewijt",
    description: "Alle aankomende evenementen van KCVV Elewijt",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
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
        {upcomingEvents.length === 0 ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center px-4 py-16">
            <div className="text-center max-w-md">
              <div className="mb-6">
                <Calendar
                  className="w-24 h-24 mx-auto text-kcvv-gray opacity-50"
                  aria-hidden="true"
                />
              </div>

              <h2 className="text-3xl font-bold text-kcvv-gray-dark mb-4">
                Geen evenementen gepland
              </h2>

              <p className="text-kcvv-gray mb-8">
                Er zijn momenteel geen aankomende evenementen. Bekijk het
                laatste nieuws of de wedstrijdkalender.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/nieuws"
                  className="inline-flex items-center justify-center px-6 py-3 bg-kcvv-green-bright text-white font-medium rounded-lg hover:bg-kcvv-green transition-colors"
                >
                  <Newspaper className="w-5 h-5 mr-2" aria-hidden="true" />
                  Naar nieuws
                </Link>

                <Link
                  href="/kalender"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-kcvv-gray-dark font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <CalendarDays className="w-5 h-5 mr-2" aria-hidden="true" />
                  Wedstrijdkalender
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <EventsList events={upcomingEvents} />
        )}
      </div>
    </div>
  );
}
