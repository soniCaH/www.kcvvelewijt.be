import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { DateTime } from "luxon";
import { fetchGroq } from "../sanity/fetch-groq";
import { EVENT_TIMEZONE } from "../utils/event-datetime";
import type { EventType } from "@/components/event/event-type-style";
import type {
  EVENTS_QUERY_RESULT,
  EVENT_ARTICLES_QUERY_RESULT,
  EVENT_BY_SLUG_QUERY_RESULT,
  EVENT_SLUGS_QUERY_RESULT,
  NEXT_FEATURED_EVENT_QUERY_RESULT,
} from "../sanity/sanity.types";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

// Upcoming-only: an event stays in the list until its end (or start, when
// single-day) is in the past. `coalesce(dateEnd, dateStart) >= now()` keeps
// in-progress multi-day events visible through their final day.
export const EVENTS_QUERY =
  defineQuery(`*[_type == "event" && coalesce(dateEnd, dateStart) >= now()] | order(dateStart asc) {
  "id": _id, "title": coalesce(title, ""), "slug": coalesce(slug.current, ""), eventType, "dateStart": coalesce(dateStart, ""), dateEnd, location, "featuredOnHome": false,
  "href": coalesce(externalLink.url, "#"),
  "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max"
}`);

export const NEXT_FEATURED_EVENT_QUERY = defineQuery(`
  coalesce(
    *[_type == "event" && featuredOnHome == true && dateStart > $now] | order(dateStart asc) [0] {
      "id": _id, "title": coalesce(title, ""), "slug": coalesce(slug.current, ""), eventType, "dateStart": coalesce(dateStart, ""), dateEnd, location, "featuredOnHome": coalesce(featuredOnHome, false),
      "href": coalesce(externalLink.url, "#"),
      "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max"
    },
    *[_type == "event" && dateStart > $now] | order(dateStart asc) [0] {
      "id": _id, "title": coalesce(title, ""), "slug": coalesce(slug.current, ""), eventType, "dateStart": coalesce(dateStart, ""), dateEnd, location, "featuredOnHome": coalesce(featuredOnHome, false),
      "href": coalesce(externalLink.url, "#"),
      "coverImageUrl": coverImage.asset->url + "?w=1200&q=80&fm=webp&fit=max"
    }
  )
`);

/**
 * Detail-page projection: full event payload for `/evenementen/[slug]`. The
 * `externalLink` object is read whole so the page can decide whether to
 * render the optional CTA. `coverImageUrl` is sized for the event hero.
 * `eventType` + `location` drive the `<EventHero>` pill, kicker and location
 * line (#1967); a missing `eventType` falls back to "Andere" at render time.
 */
export const EVENT_BY_SLUG_QUERY =
  defineQuery(`*[_type == "event" && slug.current == $slug][0] {
  "id": _id,
  "updatedAt": _updatedAt,
  "title": coalesce(title, ""),
  "slug": coalesce(slug.current, ""),
  eventType,
  "dateStart": coalesce(dateStart, ""),
  dateEnd,
  location,
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

/**
 * Phase 6.E §5 (#1968) — `articleType == "event"` articles that also belong in
 * the `/evenementen` feed. The event date lives on the first `eventFact` body
 * block, so the upcoming filter compares `coalesce(endDate, date)` against
 * `$today` (a Brussels-local `yyyy-MM-dd`). `$today`, not `now()`, keeps a
 * same-day all-day event in the list: the fact `date` is a date-only string,
 * which would lose lexicographically to a full `now()` datetime on its own day.
 * Only published articles surface (mirrors `ARTICLES_QUERY`'s publish window).
 * The merged ordering is applied in `mergeEventFeed`, so no `order()` here.
 */
export const EVENT_ARTICLES_QUERY =
  defineQuery(`*[_type == "article" && articleType == "event" && publishedAt <= now() && (!defined(unpublishAt) || unpublishAt > now()) && coalesce(body[_type == "eventFact"][0].endDate, body[_type == "eventFact"][0].date) >= $today] {
  "id": _id,
  "title": coalesce(pt::text(title), title, ""),
  "slug": coalesce(slug.current, ""),
  "fact": body[_type == "eventFact"][0]{ date, endDate, startTime, location, eventType }
}`);

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

// ─── Merged list feed (Phase 6.E §5, #1968) ────────────────────────────────────

/** Source of a merged feed item — drives the link target, kept for tests too. */
export type EventListSource = "event" | "article";

/**
 * One row of the merged `/evenementen` feed: a Sanity `event` document or an
 * `articleType:event` article, normalised to the shape `<TicketStub>` consumes.
 * `href` is the resolved detail target — `/evenementen/[slug]` for event docs,
 * `/nieuws/[slug]` for event articles — so the list never re-derives the path.
 * `eventType` reuses the colour-map key type (`event-type-style`), so an
 * article-sourced value (whose `eventFact` enum is authored identically) is
 * always a valid `EVENT_TYPE_FILL` key — drift between the two enums would
 * surface as a compile error in `mergeEventFeed`.
 */
export interface EventListItemVM {
  id: string;
  title: string;
  href: string;
  dateStart: string;
  dateEnd: string | null;
  eventType: EventType | null;
  location: string | null;
  source: EventListSource;
}

/**
 * Build an event ISO from an `eventFact`'s calendar `date` + optional `time`
 * (`HH:mm`). The fact date is a Brussels wall-clock day, so it is encoded as an
 * offset-aware ISO in `EVENT_TIMEZONE`: `parseEventDateTime` then round-trips it
 * to the same local time (its explicit-offset branch wins over the
 * `{ zone: "utc" }` default). A missing/invalid `time` yields local midnight,
 * which `<TicketStub>` reads as all-day and renders without a time — matching
 * how event-doc `00:00` starts are handled. Returns `null` for an absent or
 * unparseable date so the caller can drop the row.
 */
function articleFactToIso(
  date: string | null | undefined,
  time?: string | null,
): string | null {
  if (!date) return null;
  const hhmm =
    typeof time === "string" && /^\d{2}:\d{2}$/.test(time) ? time : "00:00";
  const dt = DateTime.fromISO(`${date}T${hhmm}`, { zone: EVENT_TIMEZONE });
  return dt.isValid ? dt.toISO() : null;
}

/**
 * Merge the two upcoming-only sources into one chronological feed. Event docs
 * keep their datetime `dateStart`; article-sourced events derive theirs from
 * the first `eventFact` block (date + optional start time). Both are sorted
 * ascending by absolute instant so the month grouping in `<EventMonthList>`
 * receives a single ordered list. Article rows with no resolvable date are
 * dropped (an `articleType:event` should always carry an `eventFact` date, but
 * the projection types it optional).
 */
export function mergeEventFeed(
  eventRows: EVENTS_QUERY_RESULT,
  articleRows: EVENT_ARTICLES_QUERY_RESULT,
): EventListItemVM[] {
  const fromEvents: EventListItemVM[] = eventRows.map((row) => ({
    id: row.id,
    title: row.title,
    href: `/evenementen/${row.slug}`,
    dateStart: row.dateStart,
    dateEnd: row.dateEnd ?? null,
    eventType: row.eventType ?? null,
    location: row.location ?? null,
    source: "event",
  }));

  const fromArticles = articleRows.flatMap((row): EventListItemVM[] => {
    const fact = row.fact;
    const dateStart = articleFactToIso(fact?.date, fact?.startTime);
    if (!dateStart) return [];
    return [
      {
        id: row.id,
        title: row.title,
        href: `/nieuws/${row.slug}`,
        dateStart,
        dateEnd: articleFactToIso(fact?.endDate),
        eventType: fact?.eventType ?? null,
        location: fact?.location ?? null,
        source: "article",
      },
    ];
  });

  // Sort by absolute instant. An unparseable `dateStart` (only reachable via a
  // malformed event doc — `dateStart` is schema-`required`) sorts to the end
  // rather than poisoning the comparator with NaN; `<EventMonthList>` then drops
  // it when grouping.
  const sortKey = (iso: string): number => {
    const ms = DateTime.fromISO(iso).toMillis();
    return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
  };
  return [...fromEvents, ...fromArticles].sort(
    (a, b) => sortKey(a.dateStart) - sortKey(b.dateStart),
  );
}

// ─── Service ─────────────────────────────────────────────────────────────────

export interface EventRepositoryInterface {
  readonly findAll: () => Effect.Effect<EventVM[]>;
  /**
   * Merged `/evenementen` feed: upcoming `event` docs + `articleType:event`
   * articles, chronological. `findAll` stays event-docs-only for the calendar
   * (Phase 6.D) and the legacy list.
   */
  readonly findUpcomingForList: () => Effect.Effect<EventListItemVM[]>;
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
  findUpcomingForList: () =>
    Effect.all({
      events: fetchGroq<EVENTS_QUERY_RESULT>(EVENTS_QUERY),
      articles: fetchGroq<EVENT_ARTICLES_QUERY_RESULT>(EVENT_ARTICLES_QUERY, {
        // Brussels-local calendar day — see EVENT_ARTICLES_QUERY's $today note.
        today: DateTime.now().setZone(EVENT_TIMEZONE).toISODate(),
      }),
    }).pipe(
      Effect.map(({ events, articles }) => mergeEventFeed(events, articles)),
    ),
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
