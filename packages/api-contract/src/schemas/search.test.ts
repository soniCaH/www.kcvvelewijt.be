import { describe, it, expect } from "vitest";
import { Schema as S, Effect } from "effect";
import { SearchRequest, SearchResult, SearchResponse } from "./search";

describe("SearchRequest", () => {
  it("accepts minimal valid request", async () => {
    const result = await Effect.runPromise(
      S.decodeUnknown(SearchRequest)({ query: "wie regelt de kantine" }),
    );
    expect(result.query).toBe("wie regelt de kantine");
    expect(result.limit).toBe(5); // default
  });

  it("accepts request with all fields", async () => {
    const result = await Effect.runPromise(
      S.decodeUnknown(SearchRequest)({
        query: "blessure melden",
        type: "responsibility",
        limit: 3,
      }),
    );
    expect(result.type).toBe("responsibility");
    expect(result.limit).toBe(3);
  });

  it("rejects empty query", async () => {
    await expect(
      Effect.runPromise(S.decodeUnknown(SearchRequest)({ query: "" })),
    ).rejects.toThrow();
  });

  it("rejects limit above 10", async () => {
    await expect(
      Effect.runPromise(
        S.decodeUnknown(SearchRequest)({ query: "test", limit: 20 }),
      ),
    ).rejects.toThrow();
  });
});

describe("SearchResult", () => {
  it("decodes a valid result", async () => {
    const result = await Effect.runPromise(
      S.decodeUnknown(SearchResult)({
        id: "abc123",
        slug: "kantine-verantwoordelijke",
        type: "responsibilityPath",
        score: 0.92,
        title: "Kantine & evenementen",
        excerpt: "De kantine wordt beheerd door...",
      }),
    );
    expect(result.score).toBe(0.92);
  });
});

describe("SearchResponse", () => {
  it("decodes results array", async () => {
    const result = await Effect.runPromise(
      S.decodeUnknown(SearchResponse)({ results: [] }),
    );
    expect(result.results).toHaveLength(0);
  });
});
