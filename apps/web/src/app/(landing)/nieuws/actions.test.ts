import { describe, it, expect } from "vitest";
import { paginateResults } from "./utils";
import type { ArticleVM } from "@/lib/repositories/article.repository";

function makeArticle(overrides: Partial<ArticleVM> = {}): ArticleVM {
  return {
    id: `article-${Math.random().toString(36).slice(2)}`,
    title: "Test Article",
    slug: "test-article",
    publishedAt: "2026-03-15T10:00:00Z",
    featured: false,
    coverImageUrl: null,
    tags: [],
    ...overrides,
  };
}

describe("paginateResults", () => {
  it("returns hasMore=true and trims to limit when more results exist", () => {
    const articles = Array.from({ length: 7 }, (_, i) =>
      makeArticle({ id: `a-${i}`, title: `Article ${i}` }),
    );

    const result = paginateResults(articles, 6);

    expect(result.articles).toHaveLength(6);
    expect(result.hasMore).toBe(true);
  });

  it("returns hasMore=false when results equal limit", () => {
    const articles = Array.from({ length: 6 }, (_, i) =>
      makeArticle({ id: `a-${i}` }),
    );

    const result = paginateResults(articles, 6);

    expect(result.articles).toHaveLength(6);
    expect(result.hasMore).toBe(false);
  });

  it("returns hasMore=false when fewer results than limit", () => {
    const articles = Array.from({ length: 3 }, (_, i) =>
      makeArticle({ id: `a-${i}` }),
    );

    const result = paginateResults(articles, 6);

    expect(result.articles).toHaveLength(3);
    expect(result.hasMore).toBe(false);
  });

  it("returns empty array with hasMore=false for no results", () => {
    const result = paginateResults([], 6);

    expect(result.articles).toHaveLength(0);
    expect(result.hasMore).toBe(false);
  });
});
