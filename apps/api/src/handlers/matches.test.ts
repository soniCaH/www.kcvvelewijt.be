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
  FootbalistoClient,
  type FootbalistoClientInterface,
} from "../footbalisto/client";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";

const EXCLUDED_TEAM_ID = 23; // Weitse Gans — uses KCVV pitch but is not KCVV

const rawMatch = {
  id: 1,
  teamId: 1,
  date: "2025-01-15 00:00",
  time: "15:00",
  homeClub: { id: 123, name: "KCVV Elewijt" },
  awayClub: { id: 456, name: "Opponent FC" },
  goalsHomeTeam: 3,
  goalsAwayTeam: 1,
  status: 1,
  competitionType: { id: 1, name: "3de Nationale", type: "LEAGUE" },
  reportGeneral: true,
} as const;

const rawDetail = {
  general: {
    id: 99,
    date: "2025-01-15 15:00",
    homeClub: { id: 123, name: "KCVV Elewijt" },
    awayClub: { id: 456, name: "Opponent FC" },
    goalsHomeTeam: 2,
    goalsAwayTeam: 0,
    competitionType: "3de Nationale",
    viewGameReport: true,
    status: 1,
  },
} as const;

function makeClientMock(): FootbalistoClientInterface {
  return {
    getRawMatches: (_teamId) => Effect.succeed([rawMatch]),
    getRawNextMatches: () =>
      Effect.succeed([
        rawMatch,
        { ...rawMatch, id: 2, teamId: EXCLUDED_TEAM_ID },
      ]),
    getRawMatchDetail: (_matchId) => Effect.succeed(rawDetail),
    getRawRanking: () => Effect.succeed([]),
    getRawTeamStats: () => Effect.fail(new Error("not needed") as never),
    getRawTeams: () => Effect.succeed([]),
    getRawMembers: () => Effect.succeed([]),
    getRawStaff: () => Effect.succeed([]),
  };
}

function makeCacheMock(): KvCacheInterface {
  return {
    get: () => Effect.succeed(null),
    set: () => Effect.succeed(undefined),
    increment: () => Effect.succeed(undefined),
  };
}

function provide<A, E>(
  effect: Effect.Effect<A, E, FootbalistoClient | KvCacheService>,
) {
  return effect.pipe(
    Effect.provide(Layer.succeed(FootbalistoClient, makeClientMock())),
    Effect.provide(Layer.succeed(KvCacheService, makeCacheMock())),
  );
}

describe("getMatchesByTeamHandler", () => {
  it("transforms raw matches", async () => {
    const result = await Effect.runPromise(provide(getMatchesByTeamHandler(1)));
    expect(result[0]?.id).toBe(1);
    expect(result[0]?.status).toBe("finished");
    expect(result[0]?.home_team.name).toBe("KCVV Elewijt");
  });
});

describe("getNextMatchesHandler", () => {
  it(`filters out teamId ${EXCLUDED_TEAM_ID} (Weitse Gans)`, async () => {
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

  it("returns cached MatchDetail without calling client or cache.set", async () => {
    const cachedDetail = {
      id: 99,
      date: "2025-01-15T15:00:00.000Z",
      time: "15:00",
      home_team: { id: 123, name: "KCVV Elewijt", score: 2 },
      away_team: { id: 456, name: "Opponent FC", score: 0 },
      status: "finished",
      competition: "3de Nationale",
      hasReport: true,
    };

    const clientShouldNotBeCalled: FootbalistoClientInterface = {
      getRawMatches: () => Effect.fail(new Error("unexpected") as never),
      getRawNextMatches: () => Effect.fail(new Error("unexpected") as never),
      getRawMatchDetail: () => Effect.fail(new Error("unexpected") as never),
      getRawRanking: () => Effect.fail(new Error("unexpected") as never),
      getRawTeamStats: () => Effect.fail(new Error("unexpected") as never),
      getRawTeams: () => Effect.fail(new Error("unexpected") as never),
      getRawMembers: () => Effect.fail(new Error("unexpected") as never),
      getRawStaff: () => Effect.fail(new Error("unexpected") as never),
    };

    const kvSetSpy = vi.fn(() => Effect.succeed(undefined));

    const result = await Effect.runPromise(
      getMatchDetailHandler(99).pipe(
        Effect.provide(
          Layer.succeed(FootbalistoClient, clientShouldNotBeCalled),
        ),
        Effect.provide(
          Layer.succeed(KvCacheService, {
            get: () => Effect.succeed(JSON.stringify(cachedDetail)),
            set: kvSetSpy,
            increment: () => Effect.succeed(undefined),
          }),
        ),
      ),
    );

    expect(result.id).toBe(99);
    expect(result.status).toBe("finished");
    expect(kvSetSpy).not.toHaveBeenCalled();
  });

  it("uses MATCH_DETAIL_PAST TTL for finished matches", async () => {
    const setCalls: Array<[string, string, number]> = [];

    await Effect.runPromise(
      getMatchDetailHandler(99).pipe(
        Effect.provide(Layer.succeed(FootbalistoClient, makeClientMock())),
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
      ),
    );

    const detailCall = setCalls.find(([key]) =>
      key.startsWith("match:detail:"),
    );
    expect(detailCall?.[2]).toBe(TTL.MATCH_DETAIL_PAST);
  });

  it("uses MATCH_DETAIL_LIVE TTL for scheduled matches", async () => {
    const scheduledDetail = {
      general: {
        id: 100,
        date: "2025-06-01 15:00",
        homeClub: { id: 123, name: "KCVV Elewijt" },
        awayClub: { id: 456, name: "Opponent FC" },
        goalsHomeTeam: null,
        goalsAwayTeam: null,
        competitionType: "3de Nationale",
        viewGameReport: false,
        status: 0, // scheduled
      },
    } as const;

    const setCalls: Array<[string, string, number]> = [];

    await Effect.runPromise(
      getMatchDetailHandler(100).pipe(
        Effect.provide(
          Layer.succeed(FootbalistoClient, {
            ...makeClientMock(),
            getRawMatchDetail: () => Effect.succeed(scheduledDetail),
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
    const result = await Effect.runPromise(provide(getMatchByIdHandler(99)));
    expect(result.id).toBe(99);
    expect("lineup" in result).toBe(false);
  });
});
