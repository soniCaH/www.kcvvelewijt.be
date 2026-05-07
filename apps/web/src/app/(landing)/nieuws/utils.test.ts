import { describe, it, expect } from "vitest";
import type { ArticleVM } from "@/lib/repositories/article.repository";
import { deduplicateById } from "./utils";

function makeArticle(id: string): ArticleVM {
  return {
    id,
    title: `Article ${id}`,
    slug: `article-${id}`,
    publishedAt: "2026-03-15T10:00:00Z",
    featured: false,
    coverImageUrl: null,
    tags: [],
  };
}

describe("deduplicateById", () => {
  it("returns all articles when there are no duplicates", () => {
    const articles = [makeArticle("1"), makeArticle("2"), makeArticle("3")];
    const result = deduplicateById(articles, new Set());
    expect(result).toHaveLength(3);
    expect(result.map((a) => a.id)).toEqual(["1", "2", "3"]);
  });

  it("removes articles whose IDs are in existingIds", () => {
    const articles = [makeArticle("1"), makeArticle("2"), makeArticle("3")];
    const result = deduplicateById(articles, new Set(["1", "3"]));
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("2");
  });

  it("removes within-batch duplicates", () => {
    const articles = [
      makeArticle("1"),
      makeArticle("2"),
      makeArticle("1"),
      makeArticle("2"),
    ];
    const result = deduplicateById(articles, new Set());
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.id)).toEqual(["1", "2"]);
  });

  it("returns empty array for empty input", () => {
    expect(deduplicateById([], new Set())).toEqual([]);
    expect(deduplicateById([], new Set(["1", "2"]))).toEqual([]);
  });

  it("returns empty array when all articles are duplicates", () => {
    const articles = [makeArticle("1"), makeArticle("2")];
    const result = deduplicateById(articles, new Set(["1", "2"]));
    expect(result).toEqual([]);
  });

  it("does not mutate the existingIds set", () => {
    const existingIds = new Set(["1"]);
    deduplicateById([makeArticle("2"), makeArticle("3")], existingIds);
    expect(existingIds.size).toBe(1);
  });
});
