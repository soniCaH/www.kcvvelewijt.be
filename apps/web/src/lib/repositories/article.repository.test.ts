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
import {
  ArticleRepository,
  ArticleRepositoryLive,
  type ArticleVM,
} from "./article.repository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch = sanityClient.fetch as any as ReturnType<typeof vi.fn>;

function runWithRepo<A>(effect: Effect.Effect<A, never, ArticleRepository>) {
  return Effect.runPromise(Effect.provide(effect, ArticleRepositoryLive));
}

function makeArticleListRow(
  overrides: Partial<ARTICLES_QUERY_RESULT[number]> = {},
): ARTICLES_QUERY_RESULT[number] {
  return {
    _id: "article-1",
    title: "Test Article",
    slug: { _type: "slug", current: "test-article" },
    publishAt: "2026-03-20T10:00:00Z",
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
    _id: "article-1",
    title: "Test Article Detail",
    slug: { _type: "slug", current: "test-article-detail" },
    publishAt: "2026-03-20T10:00:00Z",
    featured: true,
    tags: ["Eerste ploeg"],
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
        _id: "article-2",
        title: "Related Article",
        slug: { _type: "slug", current: "related-article" },
        publishAt: "2026-03-19T10:00:00Z",
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
        positionTitle: "Trainer",
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
      expect(articles[0]).toEqual<ArticleVM>({
        id: "article-1",
        title: "Test Article",
        slug: "test-article",
        publishedAt: "2026-03-20T10:00:00Z",
        featured: false,
        coverImageUrl: "https://cdn.sanity.io/cover.webp",
        tags: ["Eerste ploeg", "Wedstrijdverslag"],
      });
    });

    it("null coverImageUrl becomes undefined", async () => {
      mockFetch.mockResolvedValueOnce([
        makeArticleListRow({ coverImageUrl: null }),
      ]);

      const [a] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findAll();
        }),
      );

      expect(a.coverImageUrl).toBeUndefined();
    });

    it("null/empty tags become empty array", async () => {
      mockFetch.mockResolvedValueOnce([makeArticleListRow({ tags: null })]);

      const [a] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findAll();
        }),
      );

      expect(a.tags).toEqual([]);
    });

    it("null title becomes empty string", async () => {
      mockFetch.mockResolvedValueOnce([makeArticleListRow({ title: null })]);

      const [a] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findAll();
        }),
      );

      expect(a.title).toBe("");
    });

    it("null slug becomes empty string", async () => {
      mockFetch.mockResolvedValueOnce([makeArticleListRow({ slug: null })]);

      const [a] = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findAll();
        }),
      );

      expect(a.slug).toBe("");
    });
  });

  describe("toHomepageArticle", () => {
    it("maps fields correctly without description", async () => {
      mockFetch.mockResolvedValueOnce([makeArticleListRow()]);

      const articles = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findAll();
        }),
      );

      const { toHomepageArticle } = await import("./article.repository");
      const hp = toHomepageArticle(articles[0], false);

      expect(hp.href).toBe("/news/test-article");
      expect(hp.title).toBe("Test Article");
      expect(hp.imageAlt).toBe("Test Article");
      expect(hp.imageUrl).toBe("https://cdn.sanity.io/cover.webp");
      expect(hp.tags).toEqual([
        { name: "Eerste ploeg" },
        { name: "Wedstrijdverslag" },
      ]);
      expect(hp).not.toHaveProperty("description");
    });

    it("includes description property when includeDescription is true", async () => {
      mockFetch.mockResolvedValueOnce([makeArticleListRow()]);

      const articles = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findAll();
        }),
      );

      const { toHomepageArticle } = await import("./article.repository");
      const hp = toHomepageArticle(articles[0], true);

      expect(hp).toHaveProperty("description");
      expect(hp.description).toBeUndefined();
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
      const hp = toHomepageArticle(articles[0], false);

      expect(hp.imageUrl).toBeUndefined();
    });

    it("handles empty tags", async () => {
      mockFetch.mockResolvedValueOnce([makeArticleListRow({ tags: null })]);

      const articles = await runWithRepo(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findAll();
        }),
      );

      const { toHomepageArticle } = await import("./article.repository");
      const hp = toHomepageArticle(articles[0], false);

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
      expect(a.title).toBe("Test Article Detail");
      expect(a.slug).toBe("test-article-detail");
      expect(a.publishedAt).toBe("2026-03-20T10:00:00Z");
      expect(a.featured).toBe(true);
      expect(a.tags).toEqual(["Eerste ploeg"]);
      expect(a.coverImageUrl).toBe("https://cdn.sanity.io/cover.webp");
      expect(a.body).toEqual(row.body);
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
      expect(result!.relatedArticles![0]).toEqual({
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
        positionTitle: "Trainer",
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

      expect(result!.relatedArticles).toBeUndefined();
    });
  });

  describe("findPaginated", () => {
    it("passes offset, limit, and category to GROQ query", async () => {
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
          limit: 6,
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
