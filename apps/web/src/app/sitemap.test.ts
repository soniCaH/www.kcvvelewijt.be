import { describe, it, expect, vi, beforeEach } from "vitest";

import sitemap from "./sitemap";

const mockFetch = vi.fn();

vi.mock("@/lib/sanity/client", () => ({
  sanityClient: {
    fetch: (...args: unknown[]) => mockFetch(...args),
  },
}));

describe("sitemap.ts", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("returns all static routes with correct metadata", async () => {
    mockFetch.mockResolvedValue([]);

    const result = await sitemap();

    // Should contain all 13 static routes
    const staticEntries = result.filter(
      (e) =>
        !e.url.includes("/nieuws/") ||
        e.url === "https://www.kcvvelewijt.be/nieuws",
    );
    expect(staticEntries).toHaveLength(13);

    // Verify homepage entry
    const homepage = result.find(
      (e) => e.url === "https://www.kcvvelewijt.be/",
    );
    expect(homepage).toBeDefined();
    expect(homepage!.priority).toBe(1.0);
    expect(homepage!.changeFrequency).toBe("weekly");

    // Verify nieuws (highest changeFreq)
    const nieuws = result.find(
      (e) => e.url === "https://www.kcvvelewijt.be/nieuws",
    );
    expect(nieuws).toBeDefined();
    expect(nieuws!.priority).toBe(0.9);
    expect(nieuws!.changeFrequency).toBe("daily");

    // Verify privacy (lowest priority)
    const privacy = result.find(
      (e) => e.url === "https://www.kcvvelewijt.be/privacy",
    );
    expect(privacy).toBeDefined();
    expect(privacy!.priority).toBe(0.3);
    expect(privacy!.changeFrequency).toBe("yearly");

    // All entries should have lastModified as a Date
    for (const entry of result) {
      expect(entry.lastModified).toBeInstanceOf(Date);
    }

    // All URLs should be absolute
    for (const entry of result) {
      expect(entry.url).toMatch(/^https:\/\/www\.kcvvelewijt\.be\//);
    }
  });

  it("includes dynamic article slugs from Sanity", async () => {
    mockFetch.mockResolvedValue([
      { slug: "test-article", updatedAt: "2026-03-15T10:00:00Z" },
      { slug: "another-article", updatedAt: "2026-03-20T12:00:00Z" },
    ]);

    const result = await sitemap();

    const articleEntries = result.filter(
      (e) =>
        e.url.startsWith("https://www.kcvvelewijt.be/nieuws/") &&
        e.url !== "https://www.kcvvelewijt.be/nieuws",
    );

    expect(articleEntries).toHaveLength(2);
    expect(articleEntries[0].url).toBe(
      "https://www.kcvvelewijt.be/nieuws/test-article",
    );
    expect(articleEntries[0].lastModified).toEqual(
      new Date("2026-03-15T10:00:00Z"),
    );
    expect(articleEntries[0].changeFrequency).toBe("monthly");
    expect(articleEntries[0].priority).toBe(0.7);
  });

  it("gracefully handles Sanity fetch failure", async () => {
    mockFetch.mockRejectedValue(new Error("Sanity is down"));

    const result = await sitemap();

    // Should still return static routes
    expect(result).toHaveLength(13);
  });
});
