import { describe, it, expect, vi } from "vitest";
import { Effect, Layer, Schema as S } from "effect";
import {
  getMatchesByTeamHandler,
  getNextMatchesHandler,
  getMatchesWindowHandler,
  getMatchDetailHandler,
  getPlayerStatsHandler,
  matchDetailTtl,
} from "./matches";
import { HARD_TTL_DEFAULT, TTL } from "../cache/kv-cache";
import { PsdService, type PsdServiceInterface } from "../psd/service";
import type { BffError } from "../psd/errors";
import { UpstreamUnavailableError, ResourceNotFoundError } from "../psd/errors";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";
import { WorkerEnvTag } from "../env";
import { testEnvLayer } from "../test-helpers/env-layer";
import {
  MatchesArray,
  MatchDetail,
  PlayerSeasonStats,
  type Match as MatchType,
  type MatchDetail as MatchDetailType,
} from "@kcvv/api-contract";

const baseMatch: MatchType = {
  id: 1,
  date: new Date("2025-01-15T15:00:00.000Z"),
  time: "15:00",
  home_team: { id: 123, name: "KCVV Elewijt", score: 3 },
  away_team: { id: 456, name: "Opponent FC", score: 1 },
  status: "finished",
  competition: "LEAGUE",
};

const baseDetail: MatchDetailType = {
  id: 99,
  date: new Date("2025-01-15T15:00:00.000Z"),
  time: "15:00",
  home_team: { id: 123, name: "KCVV Elewijt", score: 2 },
  away_team: { id: 456, name: "Opponent FC", score: 0 },
  status: "finished",
  competition: "3de Nationale",
  hasReport: true,
};

function makeServiceMock(
  overrides: Partial<PsdServiceInterface> = {},
): PsdServiceInterface {
  return {
    getTeamMatches: (_teamId) => Effect.succeed([baseMatch]),
    getNextMatches: () => Effect.succeed([baseMatch]),
    getMatchesWindow: () => Effect.succeed([baseMatch]),
    getMatchDetail: (_matchId) => Effect.succeed(baseDetail),
    getRanking: () => Effect.die("not needed"),
    getOpponentHistory: () => Effect.die("not needed"),
    getCurrentSeasonId: () => Effect.succeed(123),
    getPlayerStats: (_memberId) =>
      Effect.succeed({
        memberId: 42,
        teams: [
          {
            team: "KCVV Elewijt A",
            gamesPlayed: 10,
            gamesWon: 7,
            gamesEqual: 2,
            gamesLost: 1,
            goals: 5,
            assists: 3,
            yellowCards: 1,
            redCards: 0,
            minutes: 850,
          },
        ],
      }),
    ...overrides,
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
    BffError,
    PsdService | KvCacheService | WorkerEnvTag
  >,
  overrides: Partial<PsdServiceInterface> = {},
) {
  return effect.pipe(
    Effect.provide(Layer.succeed(PsdService, makeServiceMock(overrides))),
    Effect.provide(Layer.succeed(KvCacheService, makeCacheMock())),
    Effect.provide(testEnvLayer),
  );
}

describe("getMatchesByTeamHandler", () => {
  it("returns matches from PsdService", async () => {
    const result = await Effect.runPromise(provide(getMatchesByTeamHandler(1)));
    expect(result[0]?.id).toBe(1);
    expect(result[0]?.status).toBe("finished");
    expect(result[0]?.home_team.name).toBe("KCVV Elewijt");
    expect(() => S.decodeUnknownSync(MatchesArray)(result)).not.toThrow();
  });

  it("propagates UpstreamUnavailableError from service", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        provide(getMatchesByTeamHandler(1), {
          getTeamMatches: () =>
            Effect.fail(
              new UpstreamUnavailableError({
                message: "PSD returned 503",
                status: 503,
              }),
            ),
        }),
      ),
    );
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UpstreamUnavailable");
    }
  });
});

describe("getNextMatchesHandler", () => {
  it("returns next matches from PsdService (team 23 filter is internal to service)", async () => {
    const result = await Effect.runPromise(provide(getNextMatchesHandler()));
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(1);
    expect(() => S.decodeUnknownSync(MatchesArray)(result)).not.toThrow();
  });

  it("propagates UpstreamUnavailableError from service", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        provide(getNextMatchesHandler(), {
          getNextMatches: () =>
            Effect.fail(
              new UpstreamUnavailableError({
                message: "All teams failed",
                status: 503,
              }),
            ),
        }),
      ),
    );
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UpstreamUnavailable");
    }
  });
});

describe("getMatchesWindowHandler", () => {
  it("returns windowed matches from PsdService", async () => {
    const result = await Effect.runPromise(provide(getMatchesWindowHandler()));
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(1);
    expect(() => S.decodeUnknownSync(MatchesArray)(result)).not.toThrow();
  });

  it("propagates UpstreamUnavailableError from service", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        provide(getMatchesWindowHandler(), {
          getMatchesWindow: () =>
            Effect.fail(
              new UpstreamUnavailableError({
                message: "All teams failed",
                status: 503,
              }),
            ),
        }),
      ),
    );
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UpstreamUnavailable");
    }
  });
});

describe("getMatchDetailHandler", () => {
  it("returns MatchDetail with hasReport", async () => {
    const result = await Effect.runPromise(provide(getMatchDetailHandler(99)));
    expect(result.id).toBe(99);
    expect(result.hasReport).toBe(true);
    expect(() => S.decodeUnknownSync(MatchDetail)(result)).not.toThrow();
  });

  it("stores match detail with hardTtl (7 days)", async () => {
    const setCalls: Array<[string, string, number]> = [];
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    await Effect.runPromise(
      getMatchDetailHandler(99).pipe(
        Effect.provide(
          Layer.succeed(PsdService, {
            ...makeServiceMock(),
            getMatchDetail: () =>
              Effect.succeed({ ...baseDetail, date: threeDaysAgo }),
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
        Effect.provide(testEnvLayer),
        Effect.orDie,
      ),
    );

    const detailCall = setCalls.find(([key]) =>
      key.startsWith("match:detail:"),
    );
    expect(detailCall?.[2]).toBe(HARD_TTL_DEFAULT);
  });

  it("propagates UpstreamUnavailableError from service", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        provide(getMatchDetailHandler(99), {
          getMatchDetail: () =>
            Effect.fail(
              new UpstreamUnavailableError({
                message: "PSD returned 503",
                status: 503,
              }),
            ),
        }),
      ),
    );
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UpstreamUnavailable");
    }
  });

  it("propagates ResourceNotFoundError for unknown match", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        provide(getMatchDetailHandler(999), {
          getMatchDetail: () =>
            Effect.fail(
              new ResourceNotFoundError({
                message: "Match not found",
                resourceType: "match",
                resourceId: 999,
              }),
            ),
        }),
      ),
    );
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("ResourceNotFound");
    }
  });
});

describe("matchDetailTtl", () => {
  const now = new Date("2025-06-01T12:00:00.000Z").getTime();
  const at = (offsetMs: number) => new Date(now + offsetMs);
  const H = 60 * 60 * 1000;

  it("settled ≥48h ago → 7 days (immutable)", () => {
    expect(matchDetailTtl(at(-3 * 24 * H), "finished", now)).toBe(
      TTL.MATCH_DETAIL_PAST,
    );
    expect(matchDetailTtl(at(-3 * 24 * H), "forfeited", now)).toBe(
      TTL.MATCH_DETAIL_PAST,
    );
  });

  it("within 3h of kickoff → live (60s), even when just finished", () => {
    expect(matchDetailTtl(at(0), "in_progress", now)).toBe(
      TTL.MATCH_DETAIL_LIVE,
    );
    expect(matchDetailTtl(at(-1 * H), "finished", now)).toBe(
      TTL.MATCH_DETAIL_LIVE,
    );
  });

  it("3h–24h from kickoff → matchday (300s)", () => {
    expect(matchDetailTtl(at(10 * H), "scheduled", now)).toBe(
      TTL.MATCH_DETAIL_MATCHDAY,
    );
  });

  it("1d–7d from kickoff → this week (3600s)", () => {
    expect(matchDetailTtl(at(3 * 24 * H), "scheduled", now)).toBe(
      TTL.MATCH_DETAIL_WEEK,
    );
  });

  it("beyond 7d (past or future) → distant (24h)", () => {
    expect(matchDetailTtl(at(10 * 24 * H), "scheduled", now)).toBe(
      TTL.MATCH_DETAIL_DEFAULT,
    );
    expect(matchDetailTtl(at(-10 * 24 * H), "scheduled", now)).toBe(
      TTL.MATCH_DETAIL_DEFAULT,
    );
  });

  // Exact tier cutoffs — guard the < vs >= comparisons against off-by-one.
  it("48h-finished cutoff (>= is PAST)", () => {
    expect(matchDetailTtl(at(-48 * H), "finished", now)).toBe(
      TTL.MATCH_DETAIL_PAST, // exactly 48h ago → immutable
    );
    expect(matchDetailTtl(at(-48 * H - 1), "finished", now)).toBe(
      TTL.MATCH_DETAIL_PAST, // just over 48h → immutable
    );
    expect(matchDetailTtl(at(-48 * H + 1), "finished", now)).toBe(
      TTL.MATCH_DETAIL_WEEK, // just under 48h → not yet immutable, ~48h distance
    );
  });

  it("3h cutoff (< is LIVE)", () => {
    expect(matchDetailTtl(at(3 * H - 1), "scheduled", now)).toBe(
      TTL.MATCH_DETAIL_LIVE,
    );
    expect(matchDetailTtl(at(3 * H), "scheduled", now)).toBe(
      TTL.MATCH_DETAIL_MATCHDAY,
    );
  });

  it("24h cutoff (< is MATCHDAY)", () => {
    expect(matchDetailTtl(at(24 * H - 1), "scheduled", now)).toBe(
      TTL.MATCH_DETAIL_MATCHDAY,
    );
    expect(matchDetailTtl(at(24 * H), "scheduled", now)).toBe(
      TTL.MATCH_DETAIL_WEEK,
    );
  });

  it("7d cutoff (< is WEEK)", () => {
    expect(matchDetailTtl(at(7 * 24 * H - 1), "scheduled", now)).toBe(
      TTL.MATCH_DETAIL_WEEK,
    );
    expect(matchDetailTtl(at(7 * 24 * H), "scheduled", now)).toBe(
      TTL.MATCH_DETAIL_DEFAULT,
    );
  });
});

describe("getPlayerStatsHandler", () => {
  it("returns PlayerSeasonStats from PsdService", async () => {
    const result = await Effect.runPromise(provide(getPlayerStatsHandler(42)));
    expect(result.memberId).toBe(42);
    expect(result.teams).toHaveLength(1);
    expect(result.teams[0]?.gamesPlayed).toBe(10);
    expect(result.teams[0]?.goals).toBe(5);
    expect(() => S.decodeUnknownSync(PlayerSeasonStats)(result)).not.toThrow();
  });

  it("returns empty teams array when player has no stats", async () => {
    const result = await Effect.runPromise(
      provide(getPlayerStatsHandler(999), {
        getPlayerStats: (_memberId) =>
          Effect.succeed({ memberId: 999, teams: [] }),
      }),
    );
    expect(result.memberId).toBe(999);
    expect(result.teams).toHaveLength(0);
    expect(() => S.decodeUnknownSync(PlayerSeasonStats)(result)).not.toThrow();
  });

  it("propagates UpstreamUnavailableError from service", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        provide(getPlayerStatsHandler(42), {
          getPlayerStats: () =>
            Effect.fail(
              new UpstreamUnavailableError({
                message: "PSD returned 503",
                status: 503,
              }),
            ),
        }),
      ),
    );
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UpstreamUnavailable");
    }
  });

  it("propagates ResourceNotFoundError for unknown player", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        provide(getPlayerStatsHandler(999), {
          getPlayerStats: () =>
            Effect.fail(
              new ResourceNotFoundError({
                message: "Player not found",
                resourceType: "player",
                resourceId: 999,
              }),
            ),
        }),
      ),
    );
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("ResourceNotFound");
    }
  });
});
