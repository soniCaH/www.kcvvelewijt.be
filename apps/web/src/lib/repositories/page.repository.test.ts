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
import {
  PageRepository,
  PageRepositoryLive,
  type PageVM,
} from "./page.repository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch = sanityClient.fetch as any as ReturnType<typeof vi.fn>;

function runWithRepo<A>(effect: Effect.Effect<A, never, PageRepository>) {
  return Effect.runPromise(Effect.provide(effect, PageRepositoryLive));
}

function makePageRow(
  overrides: Partial<NonNullable<PAGE_BY_SLUG_QUERY_RESULT>> = {},
): NonNullable<PAGE_BY_SLUG_QUERY_RESULT> {
  return {
    _id: "page-1",
    title: "Praktische Info",
    slug: { current: "praktische-info", _type: "slug" },
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
    it("maps all PageVM fields correctly from GROQ result", async () => {
      const row = makePageRow();
      mockFetch.mockResolvedValueOnce(row);

      const page = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* PageRepository;
          return yield* repo.findBySlug("praktische-info");
        }),
      );

      expect(page).toEqual<PageVM>({
        id: "page-1",
        title: "Praktische Info",
        slug: "praktische-info",
        body: row.body!,
      });
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

    it("null title becomes empty string", async () => {
      mockFetch.mockResolvedValueOnce(makePageRow({ title: null }));

      const page = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* PageRepository;
          return yield* repo.findBySlug("test");
        }),
      );

      expect(page?.title).toBe("");
    });

    it("null body becomes empty array", async () => {
      mockFetch.mockResolvedValueOnce(makePageRow({ body: null }));

      const page = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* PageRepository;
          return yield* repo.findBySlug("test");
        }),
      );

      expect(page?.body).toEqual([]);
    });
  });
});
