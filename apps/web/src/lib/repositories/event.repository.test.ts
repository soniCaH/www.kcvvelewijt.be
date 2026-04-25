import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import type {
  EVENTS_QUERY_RESULT,
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
import { EventRepository, EventRepositoryLive } from "./event.repository";

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
    dateStart: "2026-04-15T18:00:00Z",
    dateEnd: "2026-04-15T22:00:00Z",
    href: "https://tickets.example.com",
    coverImageUrl: "https://cdn.sanity.io/event.webp",
    featuredOnHome: false,
    ...overrides,
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
    dateStart: "2026-04-15T18:00:00Z",
    dateEnd: "2026-04-15T22:00:00Z",
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
    dateStart: "2026-08-01T14:00:00Z",
    dateEnd: null,
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
});
