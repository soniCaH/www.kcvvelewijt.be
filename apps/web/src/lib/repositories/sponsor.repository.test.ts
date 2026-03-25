import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import type { SPONSORS_QUERY_RESULT } from "../sanity/sanity.types";

// Mock the sanity client before importing the repository
vi.mock("../sanity/client", () => ({
  sanityClient: {
    fetch: vi.fn(),
  },
}));

import { sanityClient } from "../sanity/client";
import {
  SponsorRepository,
  SponsorRepositoryLive,
  type SponsorVM,
} from "./sponsor.repository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch = sanityClient.fetch as any as ReturnType<typeof vi.fn>;

function runWithRepo<A>(effect: Effect.Effect<A, never, SponsorRepository>) {
  return Effect.runPromise(Effect.provide(effect, SponsorRepositoryLive));
}

function makeSponsorRow(
  overrides: Partial<SPONSORS_QUERY_RESULT[number]> = {},
): SPONSORS_QUERY_RESULT[number] {
  return {
    _id: "sponsor-1",
    name: "Acme Corp",
    url: "https://acme.example.com",
    type: "crossing",
    tier: "hoofdsponsor",
    featured: true,
    logoUrl: "https://cdn.sanity.io/logo.webp",
    ...overrides,
  };
}

describe("SponsorRepository", () => {
  describe("findAll", () => {
    it("maps all SponsorVM fields correctly from GROQ result", async () => {
      const row = makeSponsorRow();
      mockFetch.mockResolvedValueOnce([row]);

      const sponsors = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* SponsorRepository;
          return yield* repo.findAll();
        }),
      );

      expect(sponsors).toHaveLength(1);
      expect(sponsors[0]).toEqual<SponsorVM>({
        id: "sponsor-1",
        name: "Acme Corp",
        url: "https://acme.example.com",
        type: "crossing",
        tier: "hoofdsponsor",
        featured: true,
        logoUrl: "https://cdn.sanity.io/logo.webp",
      });
    });

    it("null name becomes empty string", async () => {
      mockFetch.mockResolvedValueOnce([makeSponsorRow({ name: null })]);

      const [s] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* SponsorRepository;
          return yield* repo.findAll();
        }),
      );

      expect(s.name).toBe("");
    });

    it("null optional fields become undefined", async () => {
      mockFetch.mockResolvedValueOnce([
        makeSponsorRow({
          url: null,
          tier: null,
          featured: null,
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

      expect(s.url).toBeUndefined();
      expect(s.tier).toBeUndefined();
      expect(s.featured).toBe(false);
      expect(s.logoUrl).toBeUndefined();
      expect(s.type).toBeUndefined();
    });
  });
});
