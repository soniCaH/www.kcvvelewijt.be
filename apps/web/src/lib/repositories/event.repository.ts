import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq } from "../sanity/fetch-groq";
import type {
  EVENTS_QUERY_RESULT,
  EVENT_BY_SLUG_QUERY_RESULT,
  EVENT_SLUGS_QUERY_RESULT,
  NEXT_FEATURED_EVENT_QUERY_RESULT,
} from "../sanity/sanity.types";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

export const EVENTS_QUERY =
  defineQuery(`*[_type == "event"] | order(dateStart asc) {
  "id": _id, "title": coalesce(title, ""), "slug": coalesce(slug.current, ""), "dateStart": coalesce(dateStart, ""), dateEnd, "featuredOnHome": false,
  "href": coalesce(externalLink.url, "#"),
  "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max"
}`);

export const NEXT_FEATURED_EVENT_QUERY = defineQuery(`
  coalesce(
    *[_type == "event" && featuredOnHome == true && dateStart > $now] | order(dateStart asc) [0] {
      "id": _id, "title": coalesce(title, ""), "slug": coalesce(slug.current, ""), "dateStart": coalesce(dateStart, ""), dateEnd, "featuredOnHome": coalesce(featuredOnHome, false),
      "href": coalesce(externalLink.url, "#"),
      "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max"
    },
    *[_type == "event" && dateStart > $now] | order(dateStart asc) [0] {
      "id": _id, "title": coalesce(title, ""), "slug": coalesce(slug.current, ""), "dateStart": coalesce(dateStart, ""), dateEnd, "featuredOnHome": coalesce(featuredOnHome, false),
      "href": coalesce(externalLink.url, "#"),
      "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max"
    }
  )
`);

/**
 * Detail-page projection: full event payload for `/events/[slug]`. The
 * `externalLink` object is read whole so the page can decide whether to
 * render the optional CTA. `coverImageUrl` is sized for the event hero.
 */
export const EVENT_BY_SLUG_QUERY =
  defineQuery(`*[_type == "event" && slug.current == $slug][0] {
  "id": _id,
  "updatedAt": _updatedAt,
  "title": coalesce(title, ""),
  "slug": coalesce(slug.current, ""),
  "dateStart": coalesce(dateStart, ""),
  dateEnd,
  "coverImageUrl": coverImage.asset->url + "?w=1600&q=80&fm=webp&fit=max",
  externalLink
}`);

/**
 * Lightweight query for `generateStaticParams` — slug-only, no date filter.
 * Past events keep their permalinks (so social shares / search results
 * landed before the event don't 404). The sitemap (`apps/web/src/app/sitemap.ts`)
 * uses a stricter `coalesce(dateEnd, dateStart) > now()` filter so historical
 * events are not re-crawled, but the routes themselves stay reachable.
 */
export const EVENT_SLUGS_QUERY = defineQuery(
  `*[_type == "event" && defined(slug.current)] { "slug": coalesce(slug.current, ""), "updatedAt": _updatedAt }`,
);

// ─── View Models ─────────────────────────────────────────────────────────────

/** GROQ projection now returns the final shape — EventVM is a type alias.
 *  Omit + re-declare normalises the `coalesce()` unions typegen emits. */
export type EventVM = Omit<
  EVENTS_QUERY_RESULT[number],
  "title" | "slug" | "dateStart" | "href" | "featuredOnHome"
> & {
  title: string;
  slug: string;
  dateStart: string;
  href: string;
  featuredOnHome: boolean;
};

export type EventDetailVM = Omit<
  NonNullable<EVENT_BY_SLUG_QUERY_RESULT>,
  "title" | "slug" | "dateStart"
> & {
  title: string;
  slug: string;
  dateStart: string;
};

// ─── Service ─────────────────────────────────────────────────────────────────

export interface EventRepositoryInterface {
  readonly findAll: () => Effect.Effect<EventVM[]>;
  readonly findNextFeatured: () => Effect.Effect<EventVM | null>;
  readonly findBySlug: (slug: string) => Effect.Effect<EventDetailVM | null>;
  readonly findAllSlugs: () => Effect.Effect<EVENT_SLUGS_QUERY_RESULT>;
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
  findBySlug: (slug) =>
    fetchGroq<EVENT_BY_SLUG_QUERY_RESULT>(EVENT_BY_SLUG_QUERY, { slug }).pipe(
      Effect.map((row) => row ?? null),
    ),
  findAllSlugs: () => fetchGroq<EVENT_SLUGS_QUERY_RESULT>(EVENT_SLUGS_QUERY),
});
