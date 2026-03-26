import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import type {
  EVENTS_QUERY_RESULT,
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
  EventRepository,
  EventRepositoryLive,
  type EventVM,
} from "./event.repository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch = sanityClient.fetch as any as ReturnType<typeof vi.fn>;

function runWithRepo<A>(effect: Effect.Effect<A, never, EventRepository>) {
  return Effect.runPromise(Effect.provide(effect, EventRepositoryLive));
}

function makeEventRow(
  overrides: Partial<EVENTS_QUERY_RESULT[number]> = {},
): EVENTS_QUERY_RESULT[number] {
  return {
    _id: "event-1",
    title: "Spaghetti-avond",
    dateStart: "2026-04-15T18:00:00Z",
    dateEnd: "2026-04-15T22:00:00Z",
    externalLink: { url: "https://tickets.example.com", label: "Tickets" },
    coverImageUrl: "https://cdn.sanity.io/event.webp",
    ...overrides,
  };
}

function makeFeaturedEventRow(
  overrides: Partial<NonNullable<NEXT_FEATURED_EVENT_QUERY_RESULT>> = {},
): NonNullable<NEXT_FEATURED_EVENT_QUERY_RESULT> {
  return {
    _id: "event-2",
    title: "Seizoensopener",
    dateStart: "2026-08-01T14:00:00Z",
    dateEnd: null,
    featuredOnHome: true,
    externalLink: null,
    coverImageUrl: "https://cdn.sanity.io/featured.webp",
    ...overrides,
  };
}

describe("EventRepository", () => {
  describe("findAll", () => {
    it("maps all EventVM fields correctly from GROQ result", async () => {
      const row = makeEventRow();
      mockFetch.mockResolvedValueOnce([row]);

      const events = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* EventRepository;
          return yield* repo.findAll();
        }),
      );

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual<EventVM>({
        id: "event-1",
        title: "Spaghetti-avond",
        dateStart: "2026-04-15T18:00:00Z",
        dateEnd: "2026-04-15T22:00:00Z",
        href: "https://tickets.example.com",
        coverImageUrl: "https://cdn.sanity.io/event.webp",
        featuredOnHome: false,
      });
    });

    it("null optional fields become undefined", async () => {
      mockFetch.mockResolvedValueOnce([
        makeEventRow({
          dateEnd: null,
          externalLink: null,
          coverImageUrl: null,
          title: null,
        }),
      ]);

      const [e] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* EventRepository;
          return yield* repo.findAll();
        }),
      );

      expect(e.title).toBe("");
      expect(e.dateEnd).toBeUndefined();
      expect(e.href).toBe("#");
      expect(e.coverImageUrl).toBeUndefined();
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

    it("maps featured event fields correctly", async () => {
      mockFetch.mockResolvedValueOnce(makeFeaturedEventRow());

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* EventRepository;
          return yield* repo.findNextFeatured();
        }),
      );

      expect(result).toEqual<EventVM>({
        id: "event-2",
        title: "Seizoensopener",
        dateStart: "2026-08-01T14:00:00Z",
        dateEnd: undefined,
        href: "#",
        coverImageUrl: "https://cdn.sanity.io/featured.webp",
        featuredOnHome: true,
      });
    });
  });
});
