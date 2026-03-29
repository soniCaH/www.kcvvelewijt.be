import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import type { JEUGD_LANDING_PAGE_QUERY_RESULT } from "../sanity/sanity.types";

// Mock the sanity client before importing the repository
vi.mock("../sanity/client", () => ({
  sanityClient: {
    fetch: vi.fn(),
  },
}));

import { sanityClient } from "../sanity/client";
import {
  JeugdLandingPageRepository,
  JeugdLandingPageRepositoryLive,
  type EditorialCardConfig,
} from "./jeugd-landing-page.repository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch = sanityClient.fetch as any as ReturnType<typeof vi.fn>;

function runWithRepo<A>(
  effect: Effect.Effect<A, never, JeugdLandingPageRepository>,
) {
  return Effect.runPromise(
    Effect.provide(effect, JeugdLandingPageRepositoryLive),
  );
}

function makeCard(
  overrides: Partial<
    NonNullable<
      NonNullable<JEUGD_LANDING_PAGE_QUERY_RESULT>["editorialCards"]
    >[number]
  > = {},
) {
  return {
    tag: "Aansluiten",
    title: "Word lid van KCVV",
    description: "Nieuwe spelers zijn altijd welkom.",
    arrowText: "Schrijf je in",
    href: "/club/inschrijven",
    imageUrl: "https://cdn.sanity.io/aansluiten.webp",
    position: "medium" as const,
    cardType: "nav" as const,
    ...overrides,
  };
}

describe("JeugdLandingPageRepository", () => {
  describe("getEditorialCards", () => {
    it("returns null when the Sanity document does not exist", async () => {
      mockFetch.mockResolvedValueOnce(null);

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* JeugdLandingPageRepository;
          return yield* repo.getEditorialCards();
        }),
      );

      expect(result).toBeNull();
    });

    it("returns null when editorialCards field is null", async () => {
      mockFetch.mockResolvedValueOnce({ editorialCards: null });

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* JeugdLandingPageRepository;
          return yield* repo.getEditorialCards();
        }),
      );

      expect(result).toBeNull();
    });

    it("maps a nav card correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        editorialCards: [makeCard()],
      });

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* JeugdLandingPageRepository;
          return yield* repo.getEditorialCards();
        }),
      );

      expect(result).toHaveLength(1);
      expect(result![0]).toEqual<EditorialCardConfig>({
        tag: "Aansluiten",
        title: "Word lid van KCVV",
        description: "Nieuwe spelers zijn altijd welkom.",
        arrowText: "Schrijf je in",
        href: "/club/inschrijven",
        imageUrl: "https://cdn.sanity.io/aansluiten.webp",
        position: "medium",
        cardType: "nav",
      });
    });

    it("maps an article slot card correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        editorialCards: [
          makeCard({
            tag: null,
            title: null,
            description: null,
            arrowText: null,
            href: null,
            imageUrl: null,
            position: "featured",
            cardType: "article",
          }),
        ],
      });

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* JeugdLandingPageRepository;
          return yield* repo.getEditorialCards();
        }),
      );

      expect(result).toHaveLength(1);
      expect(result![0]).toEqual<EditorialCardConfig>({
        tag: null,
        title: null,
        description: null,
        arrowText: null,
        href: null,
        imageUrl: null,
        position: "featured",
        cardType: "article",
      });
    });

    it("maps multiple cards preserving order", async () => {
      mockFetch.mockResolvedValueOnce({
        editorialCards: [
          makeCard({ cardType: "article", position: "featured" }),
          makeCard({
            tag: "Visie",
            title: "Onze jeugdvisie",
            position: "third",
          }),
          makeCard({ cardType: "article", position: "medium" }),
        ],
      });

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* JeugdLandingPageRepository;
          return yield* repo.getEditorialCards();
        }),
      );

      expect(result).toHaveLength(3);
      expect(result![0].cardType).toBe("article");
      expect(result![1].tag).toBe("Visie");
      expect(result![2].cardType).toBe("article");
    });

    it("skips cards with unknown position values", async () => {
      mockFetch.mockResolvedValueOnce({
        editorialCards: [
          makeCard({ position: "featured" }),
          // card with null position is invalid - should be skipped
          { ...makeCard(), position: null },
        ],
      });

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* JeugdLandingPageRepository;
          return yield* repo.getEditorialCards();
        }),
      );

      expect(result).toHaveLength(1);
      expect(result![0].position).toBe("featured");
    });
  });
});
