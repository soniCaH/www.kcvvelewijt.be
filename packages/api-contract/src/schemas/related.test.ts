import { describe, it, expect } from "vitest";
import { Schema as S, Effect } from "effect";
import { RelatedItem } from "./related";

describe("RelatedItem", () => {
  it("rejects responsibility type (responsibility paths are excluded from related items)", async () => {
    await expect(
      Effect.runPromise(
        S.decodeUnknown(RelatedItem)({
          id: "doc-abc",
          slug: "blessure-melden",
          type: "responsibility",
          score: 0.85,
          title: "Blessure melden",
          excerpt: "Hoe meld je een blessure...",
        }),
      ),
    ).rejects.toThrow();
  });

  it("accepts article type", async () => {
    const result = await Effect.runPromise(
      S.decodeUnknown(RelatedItem)({
        id: "doc-def",
        slug: "nieuws-artikel",
        type: "article",
        score: 0.72,
        title: "Nieuws",
        excerpt: "Een nieuwsbericht...",
      }),
    );
    expect(result.type).toBe("article");
  });
});
