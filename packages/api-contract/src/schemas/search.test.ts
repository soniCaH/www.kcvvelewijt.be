import { describe, it, expect } from "vitest";
import { Schema as S, Effect } from "effect";
import {
  SearchRequest,
  SearchResult,
  SearchResponse,
  FeedbackRequest,
  FeedbackResponse,
} from "./search";

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

  it("rejects whitespace-only query", async () => {
    await expect(
      Effect.runPromise(S.decodeUnknown(SearchRequest)({ query: "   " })),
    ).rejects.toThrow();
  });

  it("rejects query longer than 1024 characters", async () => {
    await expect(
      Effect.runPromise(
        S.decodeUnknown(SearchRequest)({ query: "a".repeat(1025) }),
      ),
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
        type: "responsibility",
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

describe("FeedbackRequest", () => {
  it("accepts a valid feedback request", async () => {
    const result = await Effect.runPromise(
      S.decodeUnknown(FeedbackRequest)({
        pathSlug: "inschrijving-nieuw-lid",
        pathTitle: "Inschrijving nieuw lid",
        vote: "up",
      }),
    );
    expect(result.pathSlug).toBe("inschrijving-nieuw-lid");
    expect(result.vote).toBe("up");
  });

  it("accepts down vote", async () => {
    const result = await Effect.runPromise(
      S.decodeUnknown(FeedbackRequest)({
        pathSlug: "test",
        pathTitle: "Test",
        vote: "down",
      }),
    );
    expect(result.vote).toBe("down");
  });

  it("rejects empty pathSlug", async () => {
    await expect(
      Effect.runPromise(
        S.decodeUnknown(FeedbackRequest)({
          pathSlug: "",
          pathTitle: "Test",
          vote: "up",
        }),
      ),
    ).rejects.toThrow();
  });

  it("rejects invalid vote value", async () => {
    await expect(
      Effect.runPromise(
        S.decodeUnknown(FeedbackRequest)({
          pathSlug: "test",
          pathTitle: "Test",
          vote: "maybe",
        }),
      ),
    ).rejects.toThrow();
  });
});

describe("FeedbackResponse", () => {
  it("decodes a valid response", async () => {
    const result = await Effect.runPromise(
      S.decodeUnknown(FeedbackResponse)({ ok: true }),
    );
    expect(result.ok).toBe(true);
  });
});
