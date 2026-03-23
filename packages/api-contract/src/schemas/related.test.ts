import { describe, it, expect } from "vitest";
import { Schema as S, Effect } from "effect";
import { RelatedRequest, RelatedItem } from "./related";

describe("RelatedRequest", () => {
  it("accepts valid request with default limit", async () => {
    const result = await Effect.runPromise(
      S.decodeUnknown(RelatedRequest)({ id: "doc-abc123" }),
    );
    expect(result.id).toBe("doc-abc123");
    expect(result.limit).toBe(3);
  });

  it("accepts request with explicit limit", async () => {
    const result = await Effect.runPromise(
      S.decodeUnknown(RelatedRequest)({ id: "doc-abc123", limit: 5 }),
    );
    expect(result.limit).toBe(5);
  });

  it("rejects empty id", async () => {
    await expect(
      Effect.runPromise(S.decodeUnknown(RelatedRequest)({ id: "" })),
    ).rejects.toThrow();
  });

  it("rejects limit above 5", async () => {
    await expect(
      Effect.runPromise(
        S.decodeUnknown(RelatedRequest)({ id: "doc-abc", limit: 6 }),
      ),
    ).rejects.toThrow();
  });

  it("rejects limit below 1", async () => {
    await expect(
      Effect.runPromise(
        S.decodeUnknown(RelatedRequest)({ id: "doc-abc", limit: 0 }),
      ),
    ).rejects.toThrow();
  });
});

describe("RelatedItem", () => {
  it("accepts responsibilityPath type", async () => {
    const result = await Effect.runPromise(
      S.decodeUnknown(RelatedItem)({
        id: "doc-abc",
        slug: "blessure-melden",
        type: "responsibilityPath",
        score: 0.85,
        title: "Blessure melden",
        excerpt: "Hoe meld je een blessure...",
      }),
    );
    expect(result.type).toBe("responsibilityPath");
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
