import { describe, it, expect, vi } from "vitest";
import { Effect, Layer, Schema as S } from "effect";
import {
  getMatchesByTeamHandler,
  getNextMatchesHandler,
  getMatchesWindowHandler,
  getMatchDetailHandler,
  getPlayerStatsHandler,
  matchDetailTtl,
  teamMatchesTtl,
  nextMatchesTtl,
} from "./matches";
import { HARD_TTL_DEFAULT, TTL } from "../cache/kv-cache";
import { PsdService, type PsdServiceInterface } from "../psd/service";
import type { BffError } from "../psd/errors";
import { UpstreamUnavailableError, ResourceNotFoundError } from "../psd/errors";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";
import { noopDurableKv } from "../test-helpers/kv-cache-mock";
import { WorkerEnvTag } from "../env";
import { testEnvLayer } from "../test-helpers/env-layer";
import { PsdGateService, PsdGateTest } from "../psd/gate";
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
    delete: () => Effect.succeed(undefined),
    increment: () => Effect.succeed(undefined),
    durable: noopDurableKv,
  };
}

function provide<A>(
  effect: Effect.Effect<
    A,
    BffError,
    PsdService | KvCacheService | WorkerEnvTag | PsdGateService
  >,
  overrides: Partial<PsdServiceInterface> = {},
) {
  return effect.pipe(
    Effect.provide(Layer.succeed(PsdService, makeServiceMock(overrides))),
    Effect.provide(Layer.succeed(KvCacheService, makeCacheMock())),
    Effect.provide(PsdGateTest),
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
            delete: () => Effect.succeed(undefined),
            increment: () => Effect.succeed(undefined),
            set: vi.fn((key, value, ttl) => {
              setCalls.push([key, value, ttl]);
              return Effect.succeed(undefined);
            }),
            durable: noopDurableKv,
          }),
        ),
        Effect.provide(PsdGateTest),
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

  // A match WITH report data exercises the pure proximity ladder — the
  // report-pending override never fires, so these assert the base tiers.
  const settled = { hasReportData: true, hasReport: true };
  // Preview-shaped: past kickoff, no report data. `hasReport` distinguishes
  // "PSD says a report exists upstream" from "genuinely reportless".
  const previewFlagged = { hasReportData: false, hasReport: true };
  const previewReportless = { hasReportData: false, hasReport: false };

  it("settled ≥48h ago → 7 days (immutable)", () => {
    expect(matchDetailTtl(at(-3 * 24 * H), "finished", settled, now)).toBe(
      TTL.MATCH_DETAIL_PAST,
    );
    expect(matchDetailTtl(at(-3 * 24 * H), "forfeited", settled, now)).toBe(
      TTL.MATCH_DETAIL_PAST,
    );
  });

  it("within 3h of kickoff → live (60s), even when just finished", () => {
    expect(matchDetailTtl(at(0), "in_progress", settled, now)).toBe(
      TTL.MATCH_DETAIL_LIVE,
    );
    expect(matchDetailTtl(at(-1 * H), "finished", settled, now)).toBe(
      TTL.MATCH_DETAIL_LIVE,
    );
  });

  it("3h–24h from kickoff → matchday (300s)", () => {
    expect(matchDetailTtl(at(10 * H), "scheduled", settled, now)).toBe(
      TTL.MATCH_DETAIL_MATCHDAY,
    );
  });

  it("1d–7d from kickoff → this week (3600s)", () => {
    expect(matchDetailTtl(at(3 * 24 * H), "scheduled", settled, now)).toBe(
      TTL.MATCH_DETAIL_WEEK,
    );
  });

  it("beyond 7d (past or future) → distant (24h)", () => {
    expect(matchDetailTtl(at(10 * 24 * H), "scheduled", settled, now)).toBe(
      TTL.MATCH_DETAIL_DEFAULT,
    );
    expect(matchDetailTtl(at(-10 * 24 * H), "scheduled", settled, now)).toBe(
      TTL.MATCH_DETAIL_DEFAULT,
    );
  });

  // Exact tier cutoffs — guard the < vs >= comparisons against off-by-one.
  it("48h-finished cutoff (>= is PAST)", () => {
    expect(matchDetailTtl(at(-48 * H), "finished", settled, now)).toBe(
      TTL.MATCH_DETAIL_PAST, // exactly 48h ago → immutable
    );
    expect(matchDetailTtl(at(-48 * H - 1), "finished", settled, now)).toBe(
      TTL.MATCH_DETAIL_PAST, // just over 48h → immutable
    );
    expect(matchDetailTtl(at(-48 * H + 1), "finished", settled, now)).toBe(
      TTL.MATCH_DETAIL_WEEK, // just under 48h → not yet immutable, ~48h distance
    );
  });

  it("3h cutoff (< is LIVE)", () => {
    expect(matchDetailTtl(at(3 * H - 1), "scheduled", settled, now)).toBe(
      TTL.MATCH_DETAIL_LIVE,
    );
    expect(matchDetailTtl(at(3 * H), "scheduled", settled, now)).toBe(
      TTL.MATCH_DETAIL_MATCHDAY,
    );
  });

  it("24h cutoff (< is MATCHDAY)", () => {
    expect(matchDetailTtl(at(24 * H - 1), "scheduled", settled, now)).toBe(
      TTL.MATCH_DETAIL_MATCHDAY,
    );
    expect(matchDetailTtl(at(24 * H), "scheduled", settled, now)).toBe(
      TTL.MATCH_DETAIL_WEEK,
    );
  });

  it("7d cutoff (< is WEEK)", () => {
    expect(matchDetailTtl(at(7 * 24 * H - 1), "scheduled", settled, now)).toBe(
      TTL.MATCH_DETAIL_WEEK,
    );
    expect(matchDetailTtl(at(7 * 24 * H), "scheduled", settled, now)).toBe(
      TTL.MATCH_DETAIL_DEFAULT,
    );
  });

  it("defaults to the proximity ladder when report state is omitted", () => {
    expect(matchDetailTtl(at(-3 * 24 * H), "finished", undefined, now)).toBe(
      TTL.MATCH_DETAIL_PAST,
    );
  });

  // Report-pending override — a past match still missing its report must not be
  // pinned behind a long TTL (the "finished match shows preview" bug, #2303).
  describe("report-pending override", () => {
    it("caps a just-finished match with no report at matchday cadence", () => {
      // 30h ago, backfilled to finished but /info still preview-shaped: without
      // the override this would be WEEK (3600s); the grace window shortens it.
      expect(
        matchDetailTtl(at(-30 * H), "finished", previewReportless, now),
      ).toBe(TTL.MATCH_DETAIL_MATCHDAY);
    });

    it("keeps re-checking a settled-looking match while PSD flags a report exists", () => {
      // ≥48h ago (would be PAST=7d) but hasReport=true and no report data yet →
      // our snapshot missed it; keep polling on a matchday cadence.
      expect(
        matchDetailTtl(at(-5 * 24 * H), "finished", previewFlagged, now),
      ).toBe(TTL.MATCH_DETAIL_MATCHDAY);
    });

    it("does not over-shorten a live match already under matchday (keeps 60s)", () => {
      // 1h after kickoff, no report yet → still LIVE (min(60s, 300s) = 60s).
      expect(
        matchDetailTtl(at(-1 * H), "finished", previewReportless, now),
      ).toBe(TTL.MATCH_DETAIL_LIVE);
    });

    it("backs off for a reportless match beyond 48h with no report flag", () => {
      // 5 days ago, no report, hasReport=false → genuinely reportless, cache
      // long (PAST=7d) rather than polling forever.
      expect(
        matchDetailTtl(at(-5 * 24 * H), "finished", previewReportless, now),
      ).toBe(TTL.MATCH_DETAIL_PAST);
    });

    it("does not fire for a future match without report data", () => {
      expect(
        matchDetailTtl(at(10 * H), "scheduled", previewReportless, now),
      ).toBe(TTL.MATCH_DETAIL_MATCHDAY);
    });
  });
});

describe("teamMatchesTtl", () => {
  const now = new Date("2025-06-01T12:00:00.000Z").getTime();
  const at = (offsetMs: number) => new Date(now + offsetMs);
  const H = 60 * 60 * 1000;

  const match = (date: Date, status: MatchType["status"]): MatchType => ({
    ...baseMatch,
    date,
    status,
  });

  it("caps at matchday cadence while a played match is still 'scheduled' (result pending)", () => {
    // The "yesterday's match has no score" bug: list snapshot taken pre-match,
    // read the morning after — must refresh instead of serving the 24h entry.
    const list = [
      match(at(-16 * H), "scheduled"),
      match(at(4 * 24 * H), "scheduled"),
    ];
    expect(teamMatchesTtl(list, now)).toBe(TTL.MATCH_DETAIL_MATCHDAY);
  });

  it("keeps the daily TTL when every past match is settled", () => {
    const list = [
      match(at(-16 * H), "finished"),
      match(at(-5 * 24 * H), "forfeited"),
      match(at(4 * 24 * H), "scheduled"), // future fixture — not pending
    ];
    expect(teamMatchesTtl(list, now)).toBe(TTL.MATCHES_TEAM);
  });

  it("stops fast-polling after the 48h grace window", () => {
    // A fixture that never settles (silently dropped) must not churn forever.
    expect(teamMatchesTtl([match(at(-48 * H), "scheduled")], now)).toBe(
      TTL.MATCHES_TEAM,
    );
    expect(teamMatchesTtl([match(at(-48 * H + 1), "scheduled")], now)).toBe(
      TTL.MATCH_DETAIL_MATCHDAY,
    );
  });

  it("does not fast-poll for past matches whose status already changed", () => {
    const list = [
      match(at(-16 * H), "postponed"),
      match(at(-20 * H), "cancelled"),
      match(at(-30 * H), "stopped"),
    ];
    expect(teamMatchesTtl(list, now)).toBe(TTL.MATCHES_TEAM);
  });

  it("returns the daily TTL for an empty list", () => {
    expect(teamMatchesTtl([], now)).toBe(TTL.MATCHES_TEAM);
  });
});

describe("nextMatchesTtl", () => {
  const now = new Date("2025-06-01T12:00:00.000Z").getTime();
  const at = (offsetMs: number) => new Date(now + offsetMs);
  const H = 60 * 60 * 1000;

  const match = (date: Date): MatchType => ({ ...baseMatch, date });

  it("caps at matchday cadence once a listed fixture has kicked off", () => {
    // "Next" is computed at fetch time — a 19:00 snapshot still lists the
    // 20:00 match at 22:00. Must recompute instead of serving 4h stale.
    const list = [match(at(-2 * H)), match(at(3 * 24 * H))];
    expect(nextMatchesTtl(list, now)).toBe(TTL.MATCH_DETAIL_MATCHDAY);
  });

  it("keeps the 4h TTL while every listed kickoff is in the future", () => {
    const list = [match(at(4 * H)), match(at(3 * 24 * H))];
    expect(nextMatchesTtl(list, now)).toBe(TTL.NEXT_MATCHES);
  });

  it("returns the 4h TTL for an empty list", () => {
    expect(nextMatchesTtl([], now)).toBe(TTL.NEXT_MATCHES);
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
