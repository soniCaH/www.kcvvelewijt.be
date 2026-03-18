import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Layer } from "effect";
import { FootbalistoService, FootbalistoServiceLive } from "./service";
import { WorkerEnvTag } from "../env";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";

global.fetch = vi.fn();

function makeEnvLayer() {
  return Layer.succeed(WorkerEnvTag, {
    PSD_API_BASE_URL: "https://clubapi.prosoccerdata.com",
    PSD_IMAGE_BASE_URL: "https://kcvv.prosoccerdata.com",
    FOOTBALISTO_LOGO_CDN_URL: "https://cdn.example.com",
    PSD_API_KEY: "test-key",
    PSD_API_CLUB: "test-club",
    PSD_API_AUTH: "test-auth",
    PSD_CACHE: {} as KVNamespace,
    SANITY_PROJECT_ID: "test-project",
    SANITY_DATASET: "test",
    SANITY_API_TOKEN: "test-token",
    AI: {} as Ai,
    SEARCH_INDEX: {} as VectorizeIndex,
  });
}

const cacheMock: KvCacheInterface = {
  get: () => Effect.succeed(null),
  set: () => Effect.succeed(undefined),
  increment: () => Effect.succeed(undefined),
};

const seasons = [
  {
    id: 42,
    name: "2024-2025",
    start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
];

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

beforeEach(() => vi.clearAllMocks());

describe("FootbalistoService", () => {
  it("getTeamStats returns correct TeamStats from mocked HTTP responses", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => seasons })
      .mockResolvedValueOnce({ ok: true, json: async () => rawStats });

    const program = Effect.gen(function* () {
      const service = yield* FootbalistoService;
      return yield* service.getTeamStats(1);
    });

    const result = await Effect.runPromise(
      program.pipe(
        Effect.provide(FootbalistoServiceLive),
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
      ),
    );

    expect(result.team_id).toBe(1);
    expect(result.team_name).toBe("KCVV Elewijt A");
    expect(result.wins).toBe(18);
  });
});
