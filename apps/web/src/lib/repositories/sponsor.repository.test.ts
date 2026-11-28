import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import type { SanityReadError } from "../sanity/fetch-groq";
import type { SPONSORS_QUERY_RESULT } from "../sanity/sanity.types";

// Mock the sanity client before importing the repository
vi.mock("../sanity/client", () => ({
  sanityClient: {
    fetch: vi.fn(),
  },
}));

import { sanityClient } from "../sanity/client";
import { SponsorRepository, SponsorRepositoryLive } from "./sponsor.repository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch = sanityClient.fetch as any as ReturnType<typeof vi.fn>;

const runWithRepo = <A>(
  effect: Effect.Effect<A, SanityReadError, SponsorRepository>,
) => {
  return Effect.runPromise(Effect.provide(effect, SponsorRepositoryLive));
};

/** Fixture matches the new GROQ projection shape (field renaming + coalescing done in GROQ) */
const makeSponsorRow = (
  overrides: Partial<SPONSORS_QUERY_RESULT[number]> = {},
): SPONSORS_QUERY_RESULT[number] => {
  return {
    id: "sponsor-1",
    name: "Acme Corp",
    url: "https://acme.example.com",
    type: "crossing",
    tier: "hoofdsponsor",
    featured: true,
    description: null,
    logoUrl: "https://cdn.sanity.io/logo.webp",
    ...overrides,
  };
};

describe("SponsorRepository", () => {
  describe("findAll", () => {
    it("returns GROQ projection shape directly — no post-fetch transform", async () => {
      const row = makeSponsorRow();
      mockFetch.mockResolvedValueOnce([row]);

      const sponsors = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* SponsorRepository;
          return yield* repo.findAll();
        }),
      );

      expect(sponsors).toHaveLength(1);
      expect(sponsors[0]).toMatchObject({
        id: "sponsor-1",
        name: "Acme Corp",
        url: "https://acme.example.com",
        type: "crossing",
        tier: "hoofdsponsor",
        featured: true,
        logoUrl: "https://cdn.sanity.io/logo.webp",
      });
    });

    it("GROQ coalesce handles nulls — name defaults to empty string, featured to false", async () => {
      mockFetch.mockResolvedValueOnce([
        makeSponsorRow({ name: "", featured: false }),
      ]);

      const [s] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* SponsorRepository;
          return yield* repo.findAll();
        }),
      );

      expect(s.name).toBe("");
      expect(s.featured).toBe(false);
    });

    it("null optional fields stay null (GROQ returns null for missing values)", async () => {
      mockFetch.mockResolvedValueOnce([
        makeSponsorRow({
          url: null,
          tier: null,
          featured: false,
          logoUrl: null,
          type: null,
        }),
      ]);

      const [s] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* SponsorRepository;
          return yield* repo.findAll();
        }),
      );

      expect(s.url).toBeNull();
      expect(s.tier).toBeNull();
      expect(s.featured).toBe(false);
      expect(s.logoUrl).toBeNull();
      expect(s.type).toBeNull();
    });
  });

  describe("findMatchbal", () => {
    const find = (matchId: string) =>
      runWithRepo(
        Effect.gen(function* () {
          const repo = yield* SponsorRepository;
          return yield* repo.findMatchbal(matchId);
        }),
      );

    it("asks for the Match by id, tagged matchbal and sponsors, and returns the Sponsor", async () => {
      const row = {
        id: "sponsor-1",
        name: "Alupoort",
        url: "https://www.alupoort.be",
        logoUrl: "https://cdn.sanity.io/logo.webp",
      };
      mockFetch.mockResolvedValueOnce(row);

      expect(await find("3414")).toEqual(row);
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringMatching(
          /_type == "matchbal"[\s\S]*sponsor->active == true[\s\S]*order\(_updatedAt desc\)\[0\]/,
        ),
        { matchId: "3414" },
        { next: { revalidate: 60 * 60 * 24, tags: ["matchbal", "sponsors"] } },
      );
    });

    it("returns null for a Match without a Matchbal", async () => {
      mockFetch.mockResolvedValueOnce(null);
      expect(await find("3415")).toBeNull();
    });
  });
});
