import { Context, Effect, Layer } from "effect";
import { sanityClient } from "../sanity/client";
import {
  EVENTS_QUERY,
  NEXT_FEATURED_EVENT_QUERY,
} from "../sanity/queries/events";
import type {
  EVENTS_QUERY_RESULT,
  NEXT_FEATURED_EVENT_QUERY_RESULT,
} from "../sanity/sanity.types";

export interface EventVM {
  id: string;
  title: string;
  dateStart: string;
  dateEnd?: string;
  href: string;
  coverImageUrl?: string;
  featuredOnHome: boolean;
}

export function toEventVM(row: EVENTS_QUERY_RESULT[number]): EventVM {
  return {
    id: row._id,
    title: row.title ?? "",
    dateStart: row.dateStart ?? "",
    dateEnd: row.dateEnd ?? undefined,
    href: row.externalLink?.url ?? "#",
    coverImageUrl: row.coverImageUrl ?? undefined,
    featuredOnHome: false,
  };
}

export function toFeaturedEventVM(
  row: NonNullable<NEXT_FEATURED_EVENT_QUERY_RESULT>,
): EventVM {
  return {
    id: row._id,
    title: row.title ?? "",
    dateStart: row.dateStart ?? "",
    dateEnd: row.dateEnd ?? undefined,
    href: row.externalLink?.url ?? "#",
    coverImageUrl: row.coverImageUrl ?? undefined,
    featuredOnHome: row.featuredOnHome ?? false,
  };
}

export interface EventRepositoryInterface {
  readonly findAll: () => Effect.Effect<EventVM[], Error>;
  readonly findNextFeatured: () => Effect.Effect<EventVM | null, Error>;
}

export class EventRepository extends Context.Tag("EventRepository")<
  EventRepository,
  EventRepositoryInterface
>() {}

const fetchGroq = <T>(query: string, params?: Record<string, unknown>) =>
  Effect.tryPromise({
    try: () => sanityClient.fetch<T>(query, params ?? {}),
    catch: (cause) => new Error(`Sanity fetch failed: ${String(cause)}`),
  });

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
