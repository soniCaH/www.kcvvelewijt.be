import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Layer } from "effect";
import {
  FootbalistoClient,
  FootbalistoClientLive,
  FootbalistoError,
} from "./client";
import { WorkerEnvTag } from "../env";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";

global.fetch = vi.fn();

function makeEnvLayer() {
  return Layer.succeed(WorkerEnvTag, {
    PSD_API_BASE_URL: "https://clubapi.prosoccerdata.com",
    FOOTBALISTO_LOGO_CDN_URL: "https://cdn.example.com",
    PSD_API_KEY: "test-key",
    PSD_API_CLUB: "test-club",
    PSD_API_AUTH: "test-auth",
    PSD_CACHE: {} as KVNamespace,
    SANITY_PROJECT_ID: "test-project",
    SANITY_DATASET: "test",
    SANITY_API_TOKEN: "test-token",
  });
}

const cacheMock: KvCacheInterface = {
  get: () => Effect.succeed(null),
  set: () => Effect.succeed(undefined),
  increment: () => Effect.succeed(undefined),
};

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
};

beforeEach(() => vi.clearAllMocks());

const seasons = [
  {
    id: 42,
    name: "2024-2025",
    start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
];

function mockSeasonThenMatches(matches: unknown[]) {
  (global.fetch as ReturnType<typeof vi.fn>)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => seasons,
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: matches }),
    });
}

describe("FootbalistoClient", () => {
  it("getRawMatches fetches PSD /games/team/:teamId/seasons/:seasonId with auth headers", async () => {
    mockSeasonThenMatches([rawMatch]);

    const program = Effect.gen(function* () {
      const client = yield* FootbalistoClient;
      return yield* client.getRawMatches(123);
    });

    const result = await Effect.runPromise(
      program.pipe(
        Effect.provide(FootbalistoClientLive),
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
      ),
    );

    expect(result[0]?.id).toBe(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/games/team/123/seasons/42"),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-api-key": "test-key" }),
      }),
    );
  });

  it("getRawMatches fails with FootbalistoError on HTTP error", async () => {
    // First call is /seasons — make it fail
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    });

    const program = Effect.gen(function* () {
      const client = yield* FootbalistoClient;
      return yield* client.getRawMatches(123);
    }).pipe(Effect.flip);

    const error = await Effect.runPromise(
      program.pipe(
        Effect.provide(FootbalistoClientLive),
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
      ),
    );

    expect(error).toBeInstanceOf(FootbalistoError);
    expect((error as FootbalistoError).status).toBe(503);
  });

  it("getRawTeamStats fetches stats with dynamic date range from current season", async () => {
    const rawStats = {
      squadPlayerStatistics: [
        {
          playerId: 1,
          firstName: "Test",
          lastName: "Player",
          team: "KCVV Elewijt A",
          gamesPlayed: 25,
          gamesWon: 18,
          gamesLost: 3,
          gamesEqual: 4,
          cleanSheets: 8,
          minutes: 2250,
          goals: 2,
          assists: 1,
          yellowCards: 1,
          redCards: 0,
        },
      ],
      goalsScored: [{ goal: { id: 1 } }],
      goalsAgainst: [],
    };

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockResolvedValueOnce({ ok: true, json: async () => rawStats });

    const program = Effect.gen(function* () {
      const client = yield* FootbalistoClient;
      return yield* client.getRawTeamStats(123);
    });

    const result = await Effect.runPromise(
      program.pipe(
        Effect.provide(FootbalistoClientLive),
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
      ),
    );

    expect(result.squadPlayerStatistics[0]?.playerId).toBe(1);
    expect(global.fetch).toHaveBeenCalledWith(
      // formatPsdDate produces DDMMYYYY (8 digits) — not ISO format
      expect.stringMatching(/\/statistics\/team\/123\/from\/\d{8}\/to\/\d{8}/),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-api-key": "test-key" }),
      }),
    );
  });

  it("getRawMatchDetail fetches /games/:matchId/info with auth headers", async () => {
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
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => rawDetail,
    });

    const program = Effect.gen(function* () {
      const client = yield* FootbalistoClient;
      return yield* client.getRawMatchDetail(99);
    });

    const result = await Effect.runPromise(
      program.pipe(
        Effect.provide(FootbalistoClientLive),
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
      ),
    );

    expect(result.general.id).toBe(99);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/games/99/info"),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-api-key": "test-key" }),
      }),
    );
  });
});
