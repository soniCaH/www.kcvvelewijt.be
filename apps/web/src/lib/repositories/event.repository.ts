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
  _id, title, dateStart, dateEnd, externalLink,
  "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max"
}`);

export const NEXT_FEATURED_EVENT_QUERY = defineQuery(`
  coalesce(
    *[_type == "event" && featuredOnHome == true && dateStart > $now] | order(dateStart asc) [0] {
      _id, title, dateStart, dateEnd, featuredOnHome, externalLink,
      "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max"
    },
    *[_type == "event" && dateStart > $now] | order(dateStart asc) [0] {
      _id, title, dateStart, dateEnd, featuredOnHome, externalLink,
      "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max"
    }
  )
`);

export interface EventVM {
  id: string;
  title: string;
  dateStart: string;
  dateEnd?: string;
  href: string;
  coverImageUrl?: string;
  featuredOnHome: boolean;
}

interface EventRow {
  _id: string;
  title: string | null;
  dateStart: string | null;
  dateEnd?: string | null;
  externalLink?: { url?: string | null } | null;
  coverImageUrl?: string | null;
  featuredOnHome?: boolean | null;
}

function mapEventRowToVM(row: EventRow, featuredOnHome?: boolean): EventVM {
  return {
    id: row._id,
    title: row.title ?? "",
    dateStart: row.dateStart ?? "",
    dateEnd: row.dateEnd ?? undefined,
    href: row.externalLink?.url ?? "#",
    coverImageUrl: row.coverImageUrl ?? undefined,
    featuredOnHome: featuredOnHome ?? row.featuredOnHome ?? false,
  };
}

export function toEventVM(row: EVENTS_QUERY_RESULT[number]): EventVM {
  return mapEventRowToVM(row, false);
}

export function toFeaturedEventVM(
  row: NonNullable<NEXT_FEATURED_EVENT_QUERY_RESULT>,
): EventVM {
  return mapEventRowToVM(row);
}

export interface EventRepositoryInterface {
  readonly findAll: () => Effect.Effect<EventVM[]>;
  readonly findNextFeatured: () => Effect.Effect<EventVM | null>;
}

export class EventRepository extends Context.Tag("EventRepository")<
  EventRepository,
  EventRepositoryInterface
>() {}

export const EventRepositoryLive = Layer.succeed(EventRepository, {
  findAll: () =>
    fetchGroq<EVENTS_QUERY_RESULT>(EVENTS_QUERY).pipe(
      Effect.map((rows) => rows.map(toEventVM)),
    ),
  findNextFeatured: () =>
    fetchGroq<NEXT_FEATURED_EVENT_QUERY_RESULT>(NEXT_FEATURED_EVENT_QUERY, {
      now: new Date().toISOString(),
    }).pipe(Effect.map((row) => (row ? toFeaturedEventVM(row) : null))),
});
