import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq } from "../sanity/fetch-groq";
import type {
  EVENTS_QUERY_RESULT,
  NEXT_FEATURED_EVENT_QUERY_RESULT,
} from "../sanity/sanity.types";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

export const EVENTS_QUERY =
  defineQuery(`*[_type == "event"] | order(dateStart asc) {
  "id": _id, "title": coalesce(title, ""), "dateStart": coalesce(dateStart, ""), dateEnd, "featuredOnHome": false,
  "href": coalesce(externalLink.url, "#"),
  "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max"
}`);

export const NEXT_FEATURED_EVENT_QUERY = defineQuery(`
  coalesce(
    *[_type == "event" && featuredOnHome == true && dateStart > $now] | order(dateStart asc) [0] {
      "id": _id, "title": coalesce(title, ""), "dateStart": coalesce(dateStart, ""), dateEnd, "featuredOnHome": coalesce(featuredOnHome, false),
      "href": coalesce(externalLink.url, "#"),
      "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max"
    },
    *[_type == "event" && dateStart > $now] | order(dateStart asc) [0] {
      "id": _id, "title": coalesce(title, ""), "dateStart": coalesce(dateStart, ""), dateEnd, "featuredOnHome": coalesce(featuredOnHome, false),
      "href": coalesce(externalLink.url, "#"),
      "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max"
    }
  )
`);

// ─── View Models ─────────────────────────────────────────────────────────────

/** GROQ projection now returns the final shape — EventVM is a type alias.
 *  Omit + re-declare normalises the `coalesce()` unions typegen emits. */
export type EventVM = Omit<
  EVENTS_QUERY_RESULT[number],
  "title" | "dateStart" | "href" | "featuredOnHome"
> & {
  title: string;
  dateStart: string;
  href: string;
  featuredOnHome: boolean;
};

// ─── Service ─────────────────────────────────────────────────────────────────

export interface EventRepositoryInterface {
  readonly findAll: () => Effect.Effect<EventVM[]>;
  readonly findNextFeatured: () => Effect.Effect<EventVM | null>;
}

export class EventRepository extends Context.Tag("EventRepository")<
  EventRepository,
  EventRepositoryInterface
>() {}

export const EventRepositoryLive = Layer.succeed(EventRepository, {
  findAll: () => fetchGroq<EVENTS_QUERY_RESULT>(EVENTS_QUERY),
  findNextFeatured: () =>
    fetchGroq<NEXT_FEATURED_EVENT_QUERY_RESULT>(NEXT_FEATURED_EVENT_QUERY, {
      now: new Date().toISOString(),
    }).pipe(Effect.map((row) => row ?? null)),
});
