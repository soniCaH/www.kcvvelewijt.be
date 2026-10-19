import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import type { OpponentHistory } from "@kcvv/api-contract";
import { getOpponentHistoryHandler, opponentHistoryTtl } from "./opponent";
import { TTL } from "../cache/kv-cache";
import { wireDate } from "../test-helpers/wire-date";
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

describe("opponentHistoryTtl", () => {
  const now = new Date("2026-10-19T05:48:00.000Z").getTime();
  const H = 60 * 60 * 1000;
  const withMatches = (
    ...ms: [number, OpponentHistory["matches"][number]["status"]][]
  ): OpponentHistory =>
    ({
      ...history,
      matches: ms.map(([offset, status], i) => ({
        id: i + 1,
        date: wireDate(now + offset),
        time: "15:00",
        home_team: { id: 456, name: "Opponent FC" },
        away_team: { id: 123, name: "KCVV Elewijt" },
        status,
        competition: "LEAGUE",
      })),
    }) as OpponentHistory;

  it("refreshes at matchday cadence while a played match has no result yet", () => {
    // Erpe-Mere, 2026-10-19: the 18 Oct match still "Gepland" the morning after.
    expect(
      opponentHistoryTtl(
        withMatches([-15 * H, "scheduled"], [118 * 24 * H, "scheduled"]),
        now,
      ),
    ).toBe(TTL.MATCH_DETAIL_MATCHDAY);
  });

  it("still catches a result on a page nobody opened for days, once a day", () => {
    // A refresh is a whole season fan-out: never every 15 min for a week.
    expect(
      opponentHistoryTtl(withMatches([-5 * 24 * H, "scheduled"]), now),
    ).toBe(TTL.MATCHES_TEAM);
  });

  it("keeps the 7-day TTL once every played match is settled", () => {
    expect(
      opponentHistoryTtl(
        withMatches(
          [-15 * H, "finished"],
          [-20 * 24 * H, "scheduled"],
          [118 * 24 * H, "scheduled"],
        ),
        now,
      ),
    ).toBe(TTL.OPPONENT_HISTORY);
  });
});
