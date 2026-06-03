import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import { parseEventDateTime } from "../utils/event-datetime";
import type {
  EVENTS_QUERY_RESULT,
  EVENT_ARTICLES_QUERY_RESULT,
  EVENT_BY_SLUG_QUERY_RESULT,
  EVENT_SLUGS_QUERY_RESULT,
  NEXT_FEATURED_EVENT_QUERY_RESULT,
} from "../sanity/sanity.types";

// Mock the sanity client before importing the repository
vi.mock("../sanity/client", () => ({
  sanityClient: {
    fetch: vi.fn(),
  },
}));

import { sanityClient } from "../sanity/client";
import {
  EVENTS_QUERY,
  EVENT_ARTICLES_QUERY,
  EventRepository,
  EventRepositoryLive,
  mergeEventFeed,
} from "./event.repository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch = sanityClient.fetch as any as ReturnType<typeof vi.fn>;

function runWithRepo<A>(effect: Effect.Effect<A, never, EventRepository>) {
  return Effect.runPromise(Effect.provide(effect, EventRepositoryLive));
}

/** Fixture matches the new GROQ projection shape (field renaming + coalescing done in GROQ) */
function makeEventRow(
  overrides: Partial<EVENTS_QUERY_RESULT[number]> = {},
): EVENTS_QUERY_RESULT[number] {
  return {
    id: "event-1",
    title: "Spaghetti-avond",
    slug: "spaghetti-avond",
    eventType: "Clubevent",
    dateStart: "2026-04-15T18:00:00Z",
    dateEnd: "2026-04-15T22:00:00Z",
    location: "Sportpark Driesput, Elewijt",
    href: "https://tickets.example.com",
    coverImageUrl: "https://cdn.sanity.io/event.webp",
    featuredOnHome: false,
    ...overrides,
  };
}

/**
 * Fixture for an `articleType:event` article row (EVENT_ARTICLES_QUERY shape).
 * `fact` accepts a partial (merged onto the default block) or an explicit
 * `null` (article with no `eventFact` — projects as `fact: null`).
 */
type ArticleRow = EVENT_ARTICLES_QUERY_RESULT[number];
type ArticleFact = NonNullable<ArticleRow["fact"]>;
function makeArticleRow(
  overrides: Partial<Omit<ArticleRow, "fact">> & {
    fact?: Partial<ArticleFact> | null;
  } = {},
): ArticleRow {
  const { fact, ...rest } = overrides;
  const base: ArticleFact = {
    date: "2026-09-14",
    endDate: null,
    startTime: "10:00",
    location: "Sportpark Driesput, Elewijt",
    eventType: "Jeugdwerking",
  };
  return {
    id: "article-1",
    title: "Jeugdtornooi groot succes",
    slug: "jeugdtornooi-verslag",
    fact: fact === null ? null : { ...base, ...fact },
    ...rest,
  };
}

function makeEventDetailRow(
  overrides: Partial<NonNullable<EVENT_BY_SLUG_QUERY_RESULT>> = {},
): NonNullable<EVENT_BY_SLUG_QUERY_RESULT> {
  return {
    id: "event-1",
    updatedAt: "2026-04-01T12:00:00Z",
    title: "Spaghetti-avond",
    slug: "spaghetti-avond",
    eventType: "Clubevent",
    dateStart: "2026-04-15T18:00:00Z",
    dateEnd: "2026-04-15T22:00:00Z",
    location: "Sportpark Driesput, Elewijt",
    coverImageUrl: "https://cdn.sanity.io/event.webp",
    externalLink: { url: "https://tickets.example.com", label: "Tickets" },
    ...overrides,
  };
}

function makeFeaturedEventRow(
  overrides: Partial<NonNullable<NEXT_FEATURED_EVENT_QUERY_RESULT>> = {},
): NonNullable<NEXT_FEATURED_EVENT_QUERY_RESULT> {
  return {
    id: "event-2",
    title: "Seizoensopener",
    slug: "seizoensopener",
    eventType: "Clubevent",
    dateStart: "2026-08-01T14:00:00Z",
    dateEnd: null,
    location: "Sportpark Driesput, Elewijt",
    href: "#",
    coverImageUrl: "https://cdn.sanity.io/featured.webp",
    featuredOnHome: true,
    ...overrides,
  };
}

describe("EventRepository", () => {
  describe("findAll", () => {
    it("returns GROQ projection shape directly — no post-fetch transform", async () => {
      const row = makeEventRow();
      mockFetch.mockResolvedValueOnce([row]);

      const events = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* EventRepository;
          return yield* repo.findAll();
        }),
      );

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        id: "event-1",
        title: "Spaghetti-avond",
        dateStart: "2026-04-15T18:00:00Z",
        dateEnd: "2026-04-15T22:00:00Z",
        href: "https://tickets.example.com",
        coverImageUrl: "https://cdn.sanity.io/event.webp",
        featuredOnHome: false,
      });
    });

    it("GROQ coalesce handles nulls — title defaults to empty string, href to #", async () => {
      mockFetch.mockResolvedValueOnce([
        makeEventRow({
          title: "",
          dateEnd: null,
          href: "#",
          coverImageUrl: null,
        }),
      ]);

      const [e] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* EventRepository;
          return yield* repo.findAll();
        }),
      );

      expect(e.title).toBe("");
      expect(e.dateEnd).toBeNull();
      expect(e.href).toBe("#");
      expect(e.coverImageUrl).toBeNull();
    });

    it("projects eventType and location, passing nulls through untouched", async () => {
      mockFetch.mockResolvedValueOnce([
        makeEventRow({ eventType: "Jeugdwerking", location: "Kantine" }),
        makeEventRow({ eventType: null, location: null }),
      ]);

      const [typed, untyped] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* EventRepository;
          return yield* repo.findAll();
        }),
      );

      expect(typed.eventType).toBe("Jeugdwerking");
      expect(typed.location).toBe("Kantine");
      expect(untyped.eventType).toBeNull();
      expect(untyped.location).toBeNull();
    });

    it("queries upcoming-only events ordered by start date", () => {
      // The filter runs in GROQ (fetch is mocked here), so guard the query
      // shape directly: upcoming-only on coalesce(dateEnd, dateStart) keeps
      // in-progress multi-day events visible through their final day.
      expect(EVENTS_QUERY).toContain("coalesce(dateEnd, dateStart) >= now()");
      expect(EVENTS_QUERY).toContain("order(dateStart asc)");
      expect(EVENTS_QUERY).toContain("eventType");
      expect(EVENTS_QUERY).toContain("location");
    });
  });

  describe("findNextFeatured", () => {
    it("returns null when no upcoming events", async () => {
      mockFetch.mockResolvedValueOnce(null);

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* EventRepository;
          return yield* repo.findNextFeatured();
        }),
      );

      expect(result).toBeNull();
    });

    it("returns GROQ projection shape directly for featured event", async () => {
      mockFetch.mockResolvedValueOnce(makeFeaturedEventRow());

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* EventRepository;
          return yield* repo.findNextFeatured();
        }),
      );

      expect(result).toMatchObject({
        id: "event-2",
        title: "Seizoensopener",
        slug: "seizoensopener",
        dateStart: "2026-08-01T14:00:00Z",
        dateEnd: null,
        href: "#",
        coverImageUrl: "https://cdn.sanity.io/featured.webp",
        featuredOnHome: true,
      });
    });
  });

  describe("findBySlug", () => {
    it("returns null when no event matches the slug", async () => {
      mockFetch.mockResolvedValueOnce(null);

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* EventRepository;
          return yield* repo.findBySlug("missing");
        }),
      );

      expect(result).toBeNull();
    });

    it("returns the detail projection including externalLink for matching slug", async () => {
      mockFetch.mockResolvedValueOnce(makeEventDetailRow());

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* EventRepository;
          return yield* repo.findBySlug("spaghetti-avond");
        }),
      );

      expect(result).toMatchObject({
        id: "event-1",
        slug: "spaghetti-avond",
        title: "Spaghetti-avond",
        externalLink: { url: "https://tickets.example.com", label: "Tickets" },
      });
    });

    it("preserves null externalLink when the field is absent", async () => {
      mockFetch.mockResolvedValueOnce(
        makeEventDetailRow({ externalLink: null }),
      );

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* EventRepository;
          return yield* repo.findBySlug("spaghetti-avond");
        }),
      );

      expect(result?.externalLink).toBeNull();
    });
  });

  describe("findAllSlugs", () => {
    it("returns the slug + updatedAt rows from the projection", async () => {
      const rows: EVENT_SLUGS_QUERY_RESULT = [
        { slug: "evt-one", updatedAt: "2026-04-01T00:00:00Z" },
        { slug: "evt-two", updatedAt: "2026-05-01T00:00:00Z" },
      ];
      mockFetch.mockResolvedValueOnce(rows);

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* EventRepository;
          return yield* repo.findAllSlugs();
        }),
      );

      expect(result).toEqual(rows);
    });
  });

  describe("findUpcomingForList", () => {
    it("fetches both sources and returns one merged, chronologically-sorted feed", async () => {
      // Two concurrent fetches (Effect.all) — route by query identity, not call
      // order, since the requests race.
      mockFetch.mockImplementation((query: string) => {
        if (query === EVENTS_QUERY)
          return Promise.resolve([
            makeEventRow({
              id: "event-late",
              slug: "seizoensafsluiter",
              dateStart: "2026-09-20T18:00:00Z",
              dateEnd: null,
            }),
          ]);
        if (query === EVENT_ARTICLES_QUERY)
          return Promise.resolve([
            makeArticleRow({
              id: "article-early",
              fact: { date: "2026-09-14" },
            }),
          ]);
        return Promise.resolve(null);
      });

      try {
        const feed = await runWithRepo(
          Effect.gen(function* () {
            const repo = yield* EventRepository;
            return yield* repo.findUpcomingForList();
          }),
        );

        expect(feed.map((item) => item.id)).toEqual([
          "article-early",
          "event-late",
        ]);
        expect(feed.map((item) => item.source)).toEqual(["article", "event"]);
        expect(feed[0]?.href).toBe("/nieuws/jeugdtornooi-verslag");
        expect(feed[1]?.href).toBe("/evenementen/seizoensafsluiter");
      } finally {
        mockFetch.mockReset();
      }
    });
  });
});

describe("EVENT_ARTICLES_QUERY", () => {
  it("selects upcoming event-articles by their eventFact date within the publish window", () => {
    expect(EVENT_ARTICLES_QUERY).toContain('articleType == "event"');
    // Upcoming is gated on the first eventFact's date, against the Brussels
    // $today param (not now()) so a same-day all-day event stays in the list.
    expect(EVENT_ARTICLES_QUERY).toContain(
      'coalesce(body[_type == "eventFact"][0].endDate, body[_type == "eventFact"][0].date) >= $today',
    );
    // Only published, non-unpublished articles surface (mirrors ARTICLES_QUERY).
    expect(EVENT_ARTICLES_QUERY).toContain("publishedAt <= now()");
    expect(EVENT_ARTICLES_QUERY).toContain(
      "(!defined(unpublishAt) || unpublishAt > now())",
    );
  });
});

describe("mergeEventFeed", () => {
  it("orders event docs and event articles together by date, regardless of source", () => {
    const feed = mergeEventFeed(
      [
        makeEventRow({
          id: "e-mid",
          slug: "e-mid",
          dateStart: "2026-09-15T18:00:00Z",
          dateEnd: null,
        }),
        makeEventRow({
          id: "e-last",
          slug: "e-last",
          dateStart: "2026-09-25T18:00:00Z",
          dateEnd: null,
        }),
      ],
      [
        makeArticleRow({ id: "a-first", fact: { date: "2026-09-10" } }),
        makeArticleRow({ id: "a-third", fact: { date: "2026-09-20" } }),
      ],
    );

    expect(feed.map((item) => item.id)).toEqual([
      "a-first",
      "e-mid",
      "a-third",
      "e-last",
    ]);
  });

  it("links event docs to /evenementen/[slug] and event articles to /nieuws/[slug]", () => {
    const [art, evt] = mergeEventFeed(
      [makeEventRow({ id: "e", slug: "spaghetti-avond" })],
      [makeArticleRow({ id: "a", slug: "jeugdtornooi-verslag" })],
    ).sort((x, y) => (x.source < y.source ? -1 : 1)); // "article" < "event"

    expect(art).toMatchObject({
      source: "article",
      href: "/nieuws/jeugdtornooi-verslag",
    });
    expect(evt).toMatchObject({
      source: "event",
      href: "/evenementen/spaghetti-avond",
    });
  });

  it("carries the article's eventType + location from its eventFact block", () => {
    const [item] = mergeEventFeed(
      [],
      [
        makeArticleRow({
          fact: { eventType: "Supportersactiviteit", location: "De Kantine" },
        }),
      ],
    );

    expect(item).toMatchObject({
      eventType: "Supportersactiviteit",
      location: "De Kantine",
    });
  });

  it("derives the article start from eventFact date + startTime (Brussels wall-clock)", () => {
    const [timed] = mergeEventFeed(
      [],
      [makeArticleRow({ fact: { date: "2026-09-14", startTime: "18:30" } })],
    );

    const dt = parseEventDateTime(timed!.dateStart);
    expect(dt.toFormat("yyyy-MM-dd")).toBe("2026-09-14");
    expect(dt.toFormat("HH:mm")).toBe("18:30");
  });

  it("treats a start-time-less article as all-day — local midnight, so <TicketStub> omits the time", () => {
    const [allDay] = mergeEventFeed(
      [],
      [makeArticleRow({ fact: { date: "2026-09-14", startTime: null } })],
    );

    const dt = parseEventDateTime(allDay!.dateStart);
    expect(dt.toFormat("yyyy-MM-dd")).toBe("2026-09-14");
    expect(dt.toFormat("HH:mm")).toBe("00:00");
  });

  it("sorts an event with an unparseable dateStart to the end instead of poisoning the order", () => {
    const feed = mergeEventFeed(
      [
        makeEventRow({ id: "broken", slug: "broken", dateStart: "" }),
        makeEventRow({
          id: "valid",
          slug: "valid",
          dateStart: "2026-09-12T18:00:00Z",
        }),
      ],
      [],
    );

    expect(feed.map((item) => item.id)).toEqual(["valid", "broken"]);
  });

  it("drops article rows whose eventFact has no resolvable date", () => {
    const feed = mergeEventFeed(
      [makeEventRow({ id: "kept", slug: "kept" })],
      [
        makeArticleRow({ id: "no-date", fact: { date: null } }),
        makeArticleRow({ id: "no-fact", fact: null }),
      ],
    );

    expect(feed.map((item) => item.id)).toEqual(["kept"]);
  });
});
