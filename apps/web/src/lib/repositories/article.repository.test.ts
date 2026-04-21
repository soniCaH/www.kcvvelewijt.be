import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import type {
  ARTICLES_QUERY_RESULT,
  ARTICLE_BY_SLUG_QUERY_RESULT,
} from "../sanity/sanity.types";

vi.mock("../sanity/client", () => ({
  sanityClient: {
    fetch: vi.fn(),
  },
}));

import { sanityClient } from "../sanity/client";
import { ArticleRepository, ArticleRepositoryLive } from "./article.repository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch = sanityClient.fetch as any as ReturnType<typeof vi.fn>;

function runWithRepo<A>(effect: Effect.Effect<A, never, ArticleRepository>) {
  return Effect.runPromise(Effect.provide(effect, ArticleRepositoryLive));
}

function makeArticleListRow(
  overrides: Partial<ARTICLES_QUERY_RESULT[number]> = {},
): ARTICLES_QUERY_RESULT[number] {
  return {
    id: "article-1",
    title: "Test Article",
    slug: "test-article",
    publishedAt: "2026-03-20T10:00:00Z",
    featured: false,
    tags: ["Eerste ploeg", "Wedstrijdverslag"],
    coverImageUrl: "https://cdn.sanity.io/cover.webp",
    body: [],
    ...overrides,
  };
}

function makeArticleDetailRow(
  overrides: Partial<NonNullable<ARTICLE_BY_SLUG_QUERY_RESULT>> = {},
): NonNullable<ARTICLE_BY_SLUG_QUERY_RESULT> {
  return {
    id: "article-1",
    updatedAt: "2026-03-21T12:00:00Z",
    title: "Test Article Detail",
    slug: "test-article-detail",
    publishedAt: "2026-03-20T10:00:00Z",
    featured: true,
    tags: ["Eerste ploeg"],
    articleType: "announcement",
    coverImageUrl: "https://cdn.sanity.io/cover.webp",
    body: [
      {
        _key: "k1",
        _type: "block",
        children: [{ _type: "span", _key: "s1", text: "Hello" }],
        style: "normal",
        markDefs: null,
        fileUrl: null,
        fileSize: null,
        fileMimeType: null,
        fileOriginalFilename: null,
        asset: null,
      },
    ],
    relatedArticles: [
      {
        id: "article-2",
        title: "Related Article",
        slug: "related-article",
        publishedAt: "2026-03-19T10:00:00Z",
        unpublishAt: null,
        coverImageUrl: "https://cdn.sanity.io/related.webp",
      },
    ],
    mentionedPlayers: [
      {
        _id: "player-1",
        firstName: "Jan",
        lastName: "Janssens",
        position: "Aanvaller",
        imageUrl: "https://cdn.sanity.io/player.webp",
        psdId: "123",
      },
    ],
    mentionedTeams: [
      {
        _id: "team-1",
        name: "Eerste ploeg",
        imageUrl: "https://cdn.sanity.io/team.webp",
        slug: "eerste-ploeg",
      },
    ],
    mentionedStaffMembers: [
      {
        _id: "staff-1",
        firstName: "Piet",
        lastName: "Pieters",
        imageUrl: "https://cdn.sanity.io/staff.webp",
      },
    ],
    ...overrides,
  };
}

describe("ArticleRepository", () => {
  describe("findAll", () => {
    it("maps all ArticleVM fields correctly from GROQ result", async () => {
      const row = makeArticleListRow();
      mockFetch.mockResolvedValueOnce([row]);

      const articles = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findAll();
        }),
      );

      expect(articles).toHaveLength(1);
      expect(articles[0]).toMatchObject({
        id: "article-1",
        title: "Test Article",
        slug: "test-article",
        publishedAt: "2026-03-20T10:00:00Z",
        featured: false,
        coverImageUrl: "https://cdn.sanity.io/cover.webp",
        tags: ["Eerste ploeg", "Wedstrijdverslag"],
      });
    });

    it("null coverImageUrl stays null (GROQ returns null for missing images)", async () => {
      mockFetch.mockResolvedValueOnce([
        makeArticleListRow({ coverImageUrl: null }),
      ]);

      const [a] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findAll();
        }),
      );

      expect(a.coverImageUrl).toBeNull();
    });

    it("GROQ coalesce handles tags — returns empty array from projection", async () => {
      mockFetch.mockResolvedValueOnce([makeArticleListRow({ tags: [] })]);

      const [a] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findAll();
        }),
      );

      expect(a.tags).toEqual([]);
    });

    it("GROQ coalesce handles title — returns empty string from projection", async () => {
      mockFetch.mockResolvedValueOnce([makeArticleListRow({ title: "" })]);

      const [a] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findAll();
        }),
      );

      expect(a.title).toBe("");
    });
  });

  describe("toHomepageArticle", () => {
    it("maps fields correctly", async () => {
      mockFetch.mockResolvedValueOnce([makeArticleListRow()]);

      const articles = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findAll();
        }),
      );

      const { toHomepageArticle } = await import("./article.repository");
      const hp = toHomepageArticle(articles[0]);

      expect(hp.href).toBe("/nieuws/test-article");
      expect(hp.title).toBe("Test Article");
      expect(hp.imageAlt).toBe("Test Article");
      expect(hp.imageUrl).toBe("https://cdn.sanity.io/cover.webp");
      expect(hp.tags).toEqual([
        { name: "Eerste ploeg" },
        { name: "Wedstrijdverslag" },
      ]);
    });

    it("handles null coverImageUrl", async () => {
      mockFetch.mockResolvedValueOnce([
        makeArticleListRow({ coverImageUrl: null }),
      ]);

      const articles = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findAll();
        }),
      );

      const { toHomepageArticle } = await import("./article.repository");
      const hp = toHomepageArticle(articles[0]);

      expect(hp.imageUrl).toBeUndefined();
    });

    it("handles empty tags", async () => {
      mockFetch.mockResolvedValueOnce([makeArticleListRow({ tags: [] })]);

      const articles = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findAll();
        }),
      );

      const { toHomepageArticle } = await import("./article.repository");
      const hp = toHomepageArticle(articles[0]);

      expect(hp.tags).toEqual([]);
    });
  });

  describe("findBySlug", () => {
    it("maps all ArticleDetailVM fields correctly", async () => {
      const row = makeArticleDetailRow();
      mockFetch.mockResolvedValueOnce(row);

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findBySlug("test-article-detail");
        }),
      );

      expect(result).not.toBeNull();
      const a = result!;
      expect(a.id).toBe("article-1");
      expect(a.updatedAt).toBe("2026-03-21T12:00:00Z");
      expect(a.title).toBe("Test Article Detail");
      expect(a.slug).toBe("test-article-detail");
      expect(a.publishedAt).toBe("2026-03-20T10:00:00Z");
      expect(a.featured).toBe(true);
      expect(a.tags).toEqual(["Eerste ploeg"]);
      expect(a.articleType).toBe("announcement");
      expect(a.coverImageUrl).toBe("https://cdn.sanity.io/cover.webp");
      expect(a.body).toEqual(row.body);
    });

    it("passes through every articleType enum value and null without transformation", async () => {
      for (const value of [
        "interview",
        "announcement",
        "transfer",
        "event",
        null,
      ] as const) {
        const row = makeArticleDetailRow({ articleType: value });
        mockFetch.mockResolvedValueOnce(row);
        const result = await runWithRepo(
          Effect.gen(function* () {
            const repo = yield* ArticleRepository;
            return yield* repo.findBySlug("test-article-detail");
          }),
        );
        expect(result!.articleType).toBe(value);
      }
    });

    it("maps related articles on detail VM", async () => {
      const row = makeArticleDetailRow();
      mockFetch.mockResolvedValueOnce(row);

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findBySlug("test");
        }),
      );

      expect(result!.relatedArticles).toHaveLength(1);
      expect(result!.relatedArticles![0]).toMatchObject({
        id: "article-2",
        title: "Related Article",
        slug: "related-article",
        publishedAt: "2026-03-19T10:00:00Z",
        coverImageUrl: "https://cdn.sanity.io/related.webp",
      });
    });

    it("maps mentioned players, teams, and staff", async () => {
      const row = makeArticleDetailRow();
      mockFetch.mockResolvedValueOnce(row);

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findBySlug("test");
        }),
      );

      expect(result!.mentionedPlayers).toHaveLength(1);
      expect(result!.mentionedPlayers![0]).toEqual({
        _id: "player-1",
        firstName: "Jan",
        lastName: "Janssens",
        position: "Aanvaller",
        imageUrl: "https://cdn.sanity.io/player.webp",
        psdId: "123",
      });

      expect(result!.mentionedTeams).toHaveLength(1);
      expect(result!.mentionedTeams![0]).toEqual({
        _id: "team-1",
        name: "Eerste ploeg",
        imageUrl: "https://cdn.sanity.io/team.webp",
        slug: "eerste-ploeg",
      });

      expect(result!.mentionedStaffMembers).toHaveLength(1);
      expect(result!.mentionedStaffMembers![0]).toEqual({
        _id: "staff-1",
        firstName: "Piet",
        lastName: "Pieters",
        imageUrl: "https://cdn.sanity.io/staff.webp",
      });
    });

    it("returns null for unknown slug", async () => {
      mockFetch.mockResolvedValueOnce(null);

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findBySlug("nonexistent");
        }),
      );

      expect(result).toBeNull();
    });

    it("handles null relatedArticles", async () => {
      mockFetch.mockResolvedValueOnce(
        makeArticleDetailRow({ relatedArticles: null }),
      );

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findBySlug("test");
        }),
      );

      expect(result!.relatedArticles).toBeNull();
    });

    it("filters out related articles with publishedAt in the future", async () => {
      const futureDate = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString();
      mockFetch.mockResolvedValueOnce(
        makeArticleDetailRow({
          relatedArticles: [
            {
              id: "future-article",
              title: "Future Article",
              slug: "future-article",
              publishedAt: futureDate,
              unpublishAt: null,
              coverImageUrl: "https://cdn.sanity.io/future.webp",
            },
          ],
        }),
      );

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findBySlug("test");
        }),
      );

      expect(result!.relatedArticles).toEqual([]);
    });

    it("filters out related articles with unpublishAt in the past", async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      mockFetch.mockResolvedValueOnce(
        makeArticleDetailRow({
          relatedArticles: [
            {
              id: "expired-article",
              title: "Expired Article",
              slug: "expired-article",
              publishedAt: "2026-01-01T10:00:00Z",
              unpublishAt: pastDate,
              coverImageUrl: "https://cdn.sanity.io/expired.webp",
            },
          ],
        }),
      );

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findBySlug("test");
        }),
      );

      expect(result!.relatedArticles).toEqual([]);
    });

    it("keeps related articles within a valid published window", async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const futureDate = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString();
      mockFetch.mockResolvedValueOnce(
        makeArticleDetailRow({
          relatedArticles: [
            {
              id: "valid-article",
              title: "Valid Article",
              slug: "valid-article",
              publishedAt: pastDate,
              unpublishAt: futureDate,
              coverImageUrl: "https://cdn.sanity.io/valid.webp",
            },
          ],
        }),
      );

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findBySlug("test");
        }),
      );

      expect(result!.relatedArticles).toHaveLength(1);
      expect(result!.relatedArticles![0].id).toBe("valid-article");
    });

    it("filters mixed related articles and preserves order", async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const futureDate = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString();
      mockFetch.mockResolvedValueOnce(
        makeArticleDetailRow({
          relatedArticles: [
            {
              id: "valid-1",
              title: "Valid First",
              slug: "valid-first",
              publishedAt: pastDate,
              unpublishAt: null,
              coverImageUrl: "https://cdn.sanity.io/v1.webp",
            },
            {
              id: "future-pub",
              title: "Future Published",
              slug: "future-published",
              publishedAt: futureDate,
              unpublishAt: null,
              coverImageUrl: "https://cdn.sanity.io/future.webp",
            },
            {
              id: "expired",
              title: "Expired",
              slug: "expired",
              publishedAt: "2026-01-01T10:00:00Z",
              unpublishAt: pastDate,
              coverImageUrl: "https://cdn.sanity.io/expired.webp",
            },
            {
              id: "valid-2",
              title: "Valid Second",
              slug: "valid-second",
              publishedAt: pastDate,
              unpublishAt: futureDate,
              coverImageUrl: "https://cdn.sanity.io/v2.webp",
            },
          ],
        }),
      );

      const result = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findBySlug("test");
        }),
      );

      expect(result!.relatedArticles).toHaveLength(2);
      expect(result!.relatedArticles!.map((a) => a.id)).toEqual([
        "valid-1",
        "valid-2",
      ]);
    });
  });

  describe("findPaginated", () => {
    it("passes offset, end, and category to GROQ query", async () => {
      mockFetch.mockResolvedValueOnce([makeArticleListRow()]);

      await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findPaginated({
            offset: 3,
            limit: 6,
            category: "Jeugd",
          });
        }),
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          offset: 3,
          end: 9,
          category: "Jeugd",
        }),
      );
    });

    it("defaults category to empty string", async () => {
      mockFetch.mockResolvedValueOnce([]);

      await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findPaginated({ offset: 0, limit: 9 });
        }),
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ category: "" }),
      );
    });
  });

  describe("findTags", () => {
    it("returns array of tag strings", async () => {
      mockFetch.mockResolvedValueOnce(["Eerste ploeg", "Jeugd", null]);

      const tags = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findTags();
        }),
      );

      expect(tags).toEqual(["Eerste ploeg", "Jeugd", null]);
    });
  });

  describe("findRelated", () => {
    it("returns related article VMs", async () => {
      mockFetch.mockResolvedValueOnce([makeArticleListRow()]);

      const articles = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findRelated("doc-123");
        }),
      );

      expect(articles).toHaveLength(1);
      expect(articles[0].id).toBe("article-1");
    });
  });
});
