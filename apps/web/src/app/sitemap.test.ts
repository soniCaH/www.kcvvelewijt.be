import { describe, it, expect } from "vitest";

import sitemap from "./sitemap";

describe("sitemap.ts", () => {
  it("returns all static routes with correct metadata", async () => {
    const result = await sitemap();

    // Should contain all 13 static routes from the PRD
    expect(result).toHaveLength(13);

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
});
