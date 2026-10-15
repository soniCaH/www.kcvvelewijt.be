/**
 * #3468: `/search` ceilings — the 1-hour response cache, the per-visitor and
 * global rate limits, and the fixed 503 text. Workers AI, Vectorize and the
 * rate-limit bindings are stubbed; the cache runs on the real KvCacheLive.
 */
import { describe, expect, it, vi } from "vitest";
import { Effect, Layer } from "effect";
import type { SearchRequest } from "@kcvv/api-contract";
import { searchCacheKey, searchWithCeilings } from "./search";
import { KvCacheLive } from "../cache/kv-cache";
import { makeTestEnvLayer } from "../test-helpers/env-layer";
import { EmbeddingService, EmbeddingError } from "../search/embedding";
import { VectorizeService } from "../search/vectorize";
import { AiAnswerService } from "../search/ai-answer";

/** Stub of the Workers Rate Limiting binding: `limit` calls per key. */
function stubLimiter(limit: number) {
  const seen = new Map<string, number>();
  return {
    limit: vi.fn(async ({ key }: { key: string }) => {
      const n = (seen.get(key) ?? 0) + 1;
      seen.set(key, n);
      return { success: n <= limit };
    }),
  };
}

function makeKv() {
  const store = new Map<string, string>();
  return {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => {
      // Real KV rejects a key over 512 bytes.
      if (new TextEncoder().encode(key).length > 512)
        throw new Error("KV key too long");
      store.set(key, value);
    },
    delete: async (key: string) => {
      store.delete(key);
    },
  } as unknown as KVNamespace;
}

function setup(
  opts: {
    ipLimit?: number;
    globalLimit?: number;
    embedFails?: boolean;
    /** Top hit score; at or over LLM_SCORE_THRESHOLD an answer is asked for. */
    score?: number;
    /** What generateAnswer yields — undefined is a dropped answer. */
    answer?: string | undefined;
  } = {},
) {
  const ipLimiter = stubLimiter(opts.ipLimit ?? 10);
  const globalLimiter = stubLimiter(opts.globalLimit ?? 120);
  const embed = vi.fn(() =>
    opts.embedFails
      ? Effect.fail(new EmbeddingError("workers ai exploded: secret detail"))
      : Effect.succeed([0.1]),
  );
  const query = vi.fn(() =>
    Effect.succeed([
      {
        id: "doc-1",
        score: opts.score ?? 0.9,
        metadata: {
          slug: "kantine",
          type: "responsibility",
          title: "Kantine",
          excerpt: "Uitleg",
        },
      },
    ]),
  );
  const answer = "answer" in opts ? opts.answer : "Een antwoord.";
  const generateAnswer = vi.fn(() => Effect.succeed(answer));
  const kv = makeKv();
  const layer = Layer.mergeAll(
    KvCacheLive,
    Layer.succeed(EmbeddingService, { embed }),
    Layer.succeed(VectorizeService, {
      upsert: () => Effect.void,
      query,
      getByIds: () => Effect.succeed([]),
      deleteByIds: () => Effect.void,
    }),
    Layer.succeed(AiAnswerService, { generateAnswer }),
  ).pipe(
    Layer.provideMerge(
      makeTestEnvLayer({
        PSD_CACHE: kv,
        SEARCH_IP_LIMITER: ipLimiter as unknown as RateLimit,
        SEARCH_GLOBAL_LIMITER: globalLimiter as unknown as RateLimit,
      }),
    ),
  );
  const search = (
    payload: Partial<typeof SearchRequest.Type>,
    ip: string | null = "203.0.113.7",
  ) =>
    Effect.runPromise(
      searchWithCeilings(
        { query: "kantine", limit: 5, ...payload },
        ip ?? undefined,
      ).pipe(Effect.either, Effect.provide(layer)),
    );
  return { search, embed, query, generateAnswer, ipLimiter, globalLimiter };
}

describe("searchCacheKey", () => {
  const key = (request: typeof SearchRequest.Type) =>
    Effect.runPromise(searchCacheKey(request));

  it("normalises the query: trimmed, lowercased, whitespace collapsed", async () => {
    expect(await key({ query: "  Waar   is de\tKANTINE ", limit: 5 })).toBe(
      await key({ query: "waar is de kantine", limit: 5 }),
    );
  });

  it("keeps the prefix readable and hashes the query to SHA-256 hex", async () => {
    expect(await key({ query: "kantine", type: "article", limit: 3 })).toMatch(
      /^search:v1:article:3:[0-9a-f]{64}$/,
    );
    expect(await key({ query: "kantine", limit: 5 })).toMatch(
      /^search:v1:all:5:[0-9a-f]{64}$/,
    );
  });
});

describe("searchWithCeilings — response cache (#3468)", () => {
  it("the same normalised query, type and limit makes no Embedding, Vectorize or AI call the second time", async () => {
    const { search, embed, query, generateAnswer } = setup();

    const first = await search({ query: "Kantine" });
    const second = await search({ query: "  kantine  " });

    expect(second).toEqual(first);
    expect(second).toMatchObject({ right: { answer: "Een antwoord." } });
    expect(embed).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledTimes(1);
    expect(generateAnswer).toHaveBeenCalledTimes(1);
  });

  it("a 1 024-character query is cached too", async () => {
    const { search, embed } = setup();
    const query = "a".repeat(1024);
    await search({ query });
    await search({ query });
    expect(embed).toHaveBeenCalledTimes(1);
  });

  it("a response whose answer was dropped (cap, failure, timeout) is not stored", async () => {
    const { search, embed } = setup({ answer: undefined });
    await search({});
    await search({});
    expect(embed).toHaveBeenCalledTimes(2);
  });

  it("a response that never asked for an answer is stored", async () => {
    const { search, embed, generateAnswer } = setup({ score: 0.4 });
    await search({});
    await search({});
    expect(generateAnswer).not.toHaveBeenCalled();
    expect(embed).toHaveBeenCalledTimes(1);
  });

  it("a different limit or type is a different entry", async () => {
    const { search, embed } = setup();
    await search({ limit: 5 });
    await search({ limit: 3 });
    await search({ type: "article" });
    expect(embed).toHaveBeenCalledTimes(3);
  });
});

describe("searchWithCeilings — rate limits (#3468)", () => {
  it("the 11th search from one client IP within the window is a 429 with the fixed body and no AI call", async () => {
    const { search, generateAnswer, ipLimiter } = setup({ ipLimit: 10 });

    for (let i = 0; i < 10; i++) await search({ query: `q${i}` });
    generateAnswer.mockClear();
    const eleventh = await search({ query: "q10" });

    expect(eleventh).toMatchObject({
      left: {
        _tag: "HttpTooManyRequests",
        error: "Too many searches, try again in a minute",
      },
    });
    expect(generateAnswer).not.toHaveBeenCalled();
    expect(ipLimiter.limit).toHaveBeenLastCalledWith({
      key: "ip:203.0.113.7",
    });
  });

  it("the IP limit runs before the cache: a cached query still counts", async () => {
    const { search } = setup({ ipLimit: 1 });
    await search({});
    expect(await search({})).toMatchObject({
      left: { _tag: "HttpTooManyRequests" },
    });
  });

  it("a request without a client IP uses the key ip:unknown", async () => {
    const { search, ipLimiter } = setup();
    await search({}, null);
    expect(ipLimiter.limit).toHaveBeenCalledWith({ key: "ip:unknown" });
  });

  it("the global limit runs only on a cache miss", async () => {
    const { search, globalLimiter } = setup();
    await search({});
    await search({});
    expect(globalLimiter.limit).toHaveBeenCalledTimes(1);
    expect(globalLimiter.limit).toHaveBeenCalledWith({ key: "global" });
  });

  it("over the global limit → 429 and no AI call", async () => {
    const { search, embed, generateAnswer } = setup({ globalLimit: 0 });
    expect(await search({})).toMatchObject({
      left: {
        _tag: "HttpTooManyRequests",
        error: "Too many searches, try again in a minute",
      },
    });
    expect(embed).not.toHaveBeenCalled();
    expect(generateAnswer).not.toHaveBeenCalled();
  });
});

describe("searchWithCeilings — 503 (#3468)", () => {
  it("answers exactly `Search service unavailable`, with no internal error text", async () => {
    const { search } = setup({ embedFails: true });
    const result = await search({});
    expect(result).toMatchObject({
      left: { _tag: "HttpServiceUnavailable" },
    });
    if (result._tag === "Left")
      expect(result.left.error).toBe("Search service unavailable");
  });
});
