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
    imageUrl: event.coverImageUrl ?? undefined,
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
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-white pb-[var(--footer-diagonal)]">
      {/* Hero */}
      <div className="from-green-main via-green-hover to-green-dark-hover bg-linear-to-br px-4 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-title mb-4 text-4xl font-bold md:text-6xl">
            Evenementen
          </h1>
          <p className="max-w-3xl text-xl text-white/90 md:text-2xl">
            Alle aankomende activiteiten van KCVV Elewijt
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10">
        {upcomingEvents.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 py-16">
            <div className="max-w-md text-center">
              <div className="mb-6">
                <Calendar
                  className="text-kcvv-gray mx-auto h-24 w-24 opacity-50"
                  aria-hidden="true"
                />
              </div>

              <h2 className="text-kcvv-gray-dark mb-4 text-3xl font-bold">
                Geen evenementen gepland
              </h2>

              <p className="text-kcvv-gray mb-8">
                Er zijn momenteel geen aankomende evenementen. Bekijk het
                laatste nieuws of de wedstrijdkalender.
              </p>

              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/nieuws"
                  className="bg-kcvv-green-bright hover:bg-kcvv-green inline-flex items-center justify-center rounded-lg px-6 py-3 font-medium text-white transition-colors"
                >
                  <Newspaper className="mr-2 h-5 w-5" aria-hidden="true" />
                  Naar nieuws
                </Link>

                <Link
                  href="/kalender"
                  className="text-kcvv-gray-dark inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-medium transition-colors hover:bg-gray-50"
                >
                  <CalendarDays className="mr-2 h-5 w-5" aria-hidden="true" />
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
