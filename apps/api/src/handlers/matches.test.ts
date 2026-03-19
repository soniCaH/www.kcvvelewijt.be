import { describe, it, expect, vi } from "vitest";
import { Effect, Layer } from "effect";
import {
  getMatchesByTeamHandler,
  getNextMatchesHandler,
  getMatchByIdHandler,
  getMatchDetailHandler,
} from "./matches";
import { TTL } from "../cache/kv-cache";
import {
  FootbalistoService,
  FootbalistoServiceError,
  type FootbalistoServiceInterface,
} from "../footbalisto/service";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";
import type { Match, MatchDetail } from "@kcvv/api-contract";

const baseMatch: Match = {
  id: 1,
  date: new Date("2025-01-15T15:00:00.000Z"),
  time: "15:00",
  home_team: { id: 123, name: "KCVV Elewijt", score: 3 },
  away_team: { id: 456, name: "Opponent FC", score: 1 },
  status: "finished",
  competition: "LEAGUE",
};

const baseDetail: MatchDetail = {
  id: 99,
  date: new Date("2025-01-15T15:00:00.000Z"),
  time: "15:00",
  home_team: { id: 123, name: "KCVV Elewijt", score: 2 },
  away_team: { id: 456, name: "Opponent FC", score: 0 },
  status: "finished",
  competition: "3de Nationale",
  hasReport: true,
};

const scheduledDetail: MatchDetail = {
  id: 100,
  date: new Date("2025-06-01T15:00:00.000Z"),
  time: "15:00",
  home_team: { id: 123, name: "KCVV Elewijt" },
  away_team: { id: 456, name: "Opponent FC" },
  status: "scheduled",
  competition: "3de Nationale",
  hasReport: false,
};

function makeServiceMock(): FootbalistoServiceInterface {
  return {
    getTeamStats: () => Effect.die("not needed"),
    getTeamMatches: (_teamId) => Effect.succeed([baseMatch]),
    getNextMatches: () => Effect.succeed([baseMatch]),
    getMatchById: (_matchId) => Effect.succeed({ ...baseMatch, id: 99 }),
    getMatchDetail: (_matchId) => Effect.succeed(baseDetail),
  };
}

function makeCacheMock(): KvCacheInterface {
  return {
    get: () => Effect.succeed(null),
    set: () => Effect.succeed(undefined),
    increment: () => Effect.succeed(undefined),
  };
}

function provide<A>(
  effect: Effect.Effect<
    A,
    FootbalistoServiceError,
    FootbalistoService | KvCacheService
  >,
) {
  return effect.pipe(
    Effect.provide(Layer.succeed(FootbalistoService, makeServiceMock())),
    Effect.provide(Layer.succeed(KvCacheService, makeCacheMock())),
    Effect.orDie,
  );
}

describe("getMatchesByTeamHandler", () => {
  it("returns matches from FootbalistoService", async () => {
    const result = await Effect.runPromise(provide(getMatchesByTeamHandler(1)));
    expect(result[0]?.id).toBe(1);
    expect(result[0]?.status).toBe("finished");
    expect(result[0]?.home_team.name).toBe("KCVV Elewijt");
  });
});

describe("getNextMatchesHandler", () => {
  it("returns next matches from FootbalistoService (team 23 filter is internal to service)", async () => {
    const result = await Effect.runPromise(provide(getNextMatchesHandler()));
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(1);
  });
});

describe("getMatchDetailHandler", () => {
  it("returns MatchDetail with hasReport", async () => {
    const result = await Effect.runPromise(provide(getMatchDetailHandler(99)));
    expect(result.id).toBe(99);
    expect(result.hasReport).toBe(true);
  });

  it("uses MATCH_DETAIL_PAST TTL for finished matches", async () => {
    const setCalls: Array<[string, string, number]> = [];

    await Effect.runPromise(
      getMatchDetailHandler(99).pipe(
        Effect.provide(Layer.succeed(FootbalistoService, makeServiceMock())),
        Effect.provide(
          Layer.succeed(KvCacheService, {
            get: () => Effect.succeed(null),
            increment: () => Effect.succeed(undefined),
            set: vi.fn((key, value, ttl) => {
              setCalls.push([key, value, ttl]);
              return Effect.succeed(undefined);
            }),
          }),
        ),
        Effect.orDie,
      ),
    );

    const detailCall = setCalls.find(([key]) =>
      key.startsWith("match:detail:"),
    );
    expect(detailCall?.[2]).toBe(TTL.MATCH_DETAIL_PAST);
  });

  it("uses MATCH_DETAIL_LIVE TTL for scheduled matches", async () => {
    const setCalls: Array<[string, string, number]> = [];

    await Effect.runPromise(
      getMatchDetailHandler(100).pipe(
        Effect.provide(
          Layer.succeed(FootbalistoService, {
            ...makeServiceMock(),
            getMatchDetail: () => Effect.succeed(scheduledDetail),
          }),
        ),
        Effect.provide(
          Layer.succeed(KvCacheService, {
            get: () => Effect.succeed(null),
            increment: () => Effect.succeed(undefined),
            set: vi.fn((key, value, ttl) => {
              setCalls.push([key, value, ttl]);
              return Effect.succeed(undefined);
            }),
          }),
        ),
        Effect.orDie,
      ),
    );

    const detailCall = setCalls.find(([key]) =>
      key.startsWith("match:detail:"),
    );
    expect(detailCall?.[2]).toBe(TTL.MATCH_DETAIL_LIVE);
  });
});

describe("getMatchByIdHandler", () => {
  it("returns a basic Match (no lineup)", async () => {
    const result = await Effect.runPromise(
      getMatchByIdHandler(99).pipe(
        Effect.provide(Layer.succeed(FootbalistoService, makeServiceMock())),
        Effect.orDie,
      ),
    );
    expect(result.id).toBe(99);
    expect("lineup" in result).toBe(false);
  });
});
