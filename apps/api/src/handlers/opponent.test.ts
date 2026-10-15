import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import type { OpponentHistory } from "@kcvv/api-contract";
import { getOpponentHistoryHandler } from "./opponent";
import { CACHE_VERSION } from "./matches";
import { PsdService, markPartial } from "../psd/service";
import type { PsdServiceInterface } from "../psd/service";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";
import { noopDurableKv } from "../test-helpers/kv-cache-mock";
import { PsdGateTest } from "../psd/gate";
import { testEnvLayer } from "../test-helpers/env-layer";

const history: OpponentHistory = {
  opponent: { id: 456, name: "Opponent FC" },
  summary: {
    wins: 1,
    draws: 0,
    losses: 0,
    goalsFor: 2,
    goalsAgainst: 1,
  },
  matches: [],
} as unknown as OpponentHistory;

const storedFor = async (result: OpponentHistory) => {
  const store = new Map<string, string>();
  const cache: KvCacheInterface = {
    get: () => Effect.succeed(null),
    set: (k, v) => Effect.sync(() => void store.set(k, v)),
    delete: () => Effect.succeed(undefined),
    durable: noopDurableKv,
  };
  const service = {
    getOpponentHistory: () => Effect.succeed(result),
  } as unknown as PsdServiceInterface;
  await Effect.runPromise(
    getOpponentHistoryHandler(1, 456).pipe(
      Effect.provide(Layer.succeed(PsdService, service)),
      Effect.provide(Layer.succeed(KvCacheService, cache)),
      Effect.provide(PsdGateTest),
      Effect.provide(testEnvLayer),
    ),
  );
  const raw = store.get(`opponent:team:${CACHE_VERSION}:1:club:456`);
  return raw ? (JSON.parse(raw) as { partial?: boolean }) : undefined;
};

describe("getOpponentHistoryHandler — partial history (#3489)", () => {
  it("a non-empty history with a failed season is stored flagged partial", async () => {
    expect((await storedFor(markPartial({ ...history }, true)))?.partial).toBe(
      true,
    );
  });

  it("a complete history keeps no partial flag", async () => {
    const stored = await storedFor({ ...history });
    expect(stored).toBeDefined();
    expect(stored).not.toHaveProperty("partial");
  });
});
