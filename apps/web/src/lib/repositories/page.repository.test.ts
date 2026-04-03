import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import type { PAGE_BY_SLUG_QUERY_RESULT } from "../sanity/sanity.types";

// Mock the sanity client before importing the repository
vi.mock("../sanity/client", () => ({
  sanityClient: {
    fetch: vi.fn(),
  },
}));

import { sanityClient } from "../sanity/client";
import { PageRepository, PageRepositoryLive } from "./page.repository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch = sanityClient.fetch as any as ReturnType<typeof vi.fn>;

function runWithRepo<A>(effect: Effect.Effect<A, never, PageRepository>) {
  return Effect.runPromise(Effect.provide(effect, PageRepositoryLive));
}

/** Fixture matches the new GROQ projection shape (field renaming + coalescing done in GROQ) */
function makePageRow(
  overrides: Partial<NonNullable<PAGE_BY_SLUG_QUERY_RESULT>> = {},
): NonNullable<PAGE_BY_SLUG_QUERY_RESULT> {
  return {
    id: "page-1",
    title: "Praktische Info",
    slug: "praktische-info",
    heroImageUrl: null,
    body: [
      {
        _type: "block",
        _key: "k1",
        children: [{ _type: "span", _key: "s1", text: "Hello", marks: [] }],
        style: "normal",
        markDefs: [],
        fileUrl: null,
        fileSize: null,
        fileMimeType: null,
        fileOriginalFilename: null,
        asset: null,
      },
    ],
    ...overrides,
  };
}

describe("PageRepository", () => {
  describe("findBySlug", () => {
    it("returns GROQ projection shape directly — no post-fetch transform", async () => {
      const row = makePageRow();
      mockFetch.mockResolvedValueOnce(row);

      const page = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* PageRepository;
          return yield* repo.findBySlug("praktische-info");
        }),
      );

      expect(page).toMatchObject({
        id: "page-1",
        title: "Praktische Info",
        slug: "praktische-info",
        heroImageUrl: null,
      });
      expect(page?.body).toEqual(row.body);
    });

    it("returns null for unknown slug", async () => {
      mockFetch.mockResolvedValueOnce(null);

      const page = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* PageRepository;
          return yield* repo.findBySlug("nonexistent");
        }),
      );

      expect(page).toBeNull();
    });

    it("GROQ coalesce handles nulls — title defaults to empty string", async () => {
      mockFetch.mockResolvedValueOnce(makePageRow({ title: "" }));

      const page = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* PageRepository;
          return yield* repo.findBySlug("test");
        }),
      );

      expect(page?.title).toBe("");
    });

    it("null body stays null (consumer handles with ?? [])", async () => {
      mockFetch.mockResolvedValueOnce(makePageRow({ body: null }));

      const page = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* PageRepository;
          return yield* repo.findBySlug("test");
        }),
      );

      expect(page?.body).toBeNull();
    });

    it("maps heroImageUrl when heroImage is set", async () => {
      mockFetch.mockResolvedValueOnce(
        makePageRow({
          heroImageUrl:
            "https://cdn.sanity.io/images/proj/dataset/abc.jpg?w=1600&q=80&fm=webp&fit=max",
        }),
      );

      const page = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* PageRepository;
          return yield* repo.findBySlug("test");
        }),
      );

      expect(page?.heroImageUrl).toBe(
        "https://cdn.sanity.io/images/proj/dataset/abc.jpg?w=1600&q=80&fm=webp&fit=max",
      );
    });

    it("heroImageUrl is null when heroImage is not set", async () => {
      mockFetch.mockResolvedValueOnce(makePageRow());

      const page = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* PageRepository;
          return yield* repo.findBySlug("test");
        }),
      );

      expect(page?.heroImageUrl).toBeNull();
    });
  });
});
