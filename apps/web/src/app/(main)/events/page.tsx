/**
 * Events Page
 * Upcoming club events from Sanity
 */

import type { Metadata } from "next";
import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { SanityService } from "@/lib/effect/services/SanityService";
import type { SanityEvent } from "@/lib/effect/services/SanityService";
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

/**
 * Convert a SanityEvent into an EventsListItem suitable for rendering in the UI.
 *
 * @param event - The SanityEvent to convert; uses `title`, `dateStart`, `dateEnd`, `coverImageUrl`, and `externalLink?.url`.
 * @returns An EventsListItem with `title`, `href` (uses `externalLink.url` or `"#"`), `date` from `dateStart`, optional `endDate` from `dateEnd`, and optional `imageUrl` from `coverImageUrl`.
 */
function transformEvent(event: SanityEvent): EventsListItem {
  return {
    title: event.title,
    href: event.externalLink?.url ?? "#",
    date: new Date(event.dateStart),
    endDate: event.dateEnd ? new Date(event.dateEnd) : undefined,
    imageUrl: event.coverImageUrl ?? undefined,
  };
}

/**
 * Renders the events page: fetches events from Sanity, selects upcoming events, transforms them for display, and returns the page UI.
 *
 * Fetch errors are logged and treated as an empty events list.
 *
 * @returns The React element for the events page containing a hero section and an EventsList populated with upcoming events.
 */
export default async function EventsPage() {
  const events = await runPromise(
    Effect.gen(function* () {
      const sanity = yield* SanityService;
      return yield* sanity.getEvents();
    }).pipe(
      Effect.catchAll((error) => {
        console.error("[Events] Failed to fetch events:", error);
        return Effect.succeed([] as SanityEvent[]);
      }),
    ),
  );

  const upcomingEvents = events
    .filter((e) => new Date(e.dateStart) >= new Date())
    .map(transformEvent);

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
