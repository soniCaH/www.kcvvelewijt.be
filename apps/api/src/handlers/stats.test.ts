import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { getTeamStatsHandler } from "./stats";
import {
  FootbalistoService,
  type FootbalistoServiceInterface,
} from "../footbalisto/service";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";
import { WorkerEnvTag } from "../env";

const mockServiceImpl: FootbalistoServiceInterface = {
  getTeamStats: (_teamId) =>
    Effect.succeed({
      team_id: 1,
      team_name: "KCVV Elewijt A",
      total_matches: 25,
      wins: 18,
      draws: 4,
      losses: 3,
      goals_scored: 1,
      goals_conceded: 0,
      clean_sheets: 8,
      top_scorers: [],
    }),
  getTeamMatches: () => Effect.die("not needed"),
  getNextMatches: () => Effect.die("not needed"),
  getMatchById: () => Effect.die("not needed"),
  getMatchDetail: () => Effect.die("not needed"),
  getRanking: () => Effect.die("not needed"),
};

const cacheMock: KvCacheInterface = {
  get: () => Effect.succeed(null),
  set: () => Effect.succeed(undefined),
  increment: () => Effect.succeed(undefined),
};

const testEnvLayer = Layer.succeed(WorkerEnvTag, {
  PSD_API_BASE_URL: "https://clubapi.prosoccerdata.com",
  PSD_IMAGE_BASE_URL: "https://kcvv.prosoccerdata.com",
  FOOTBALISTO_LOGO_CDN_URL: "https://cdn.example.com",
  PSD_API_KEY: "test-key",
  PSD_API_CLUB: "test-club",
  PSD_API_AUTH: "test-auth",
  PSD_CACHE: {} as KVNamespace,
  SANITY_PROJECT_ID: "test",
  SANITY_DATASET: "test",
  SANITY_API_TOKEN: "test-token",
  AI: {} as Ai,
  SEARCH_INDEX: {} as VectorizeIndex,
});

describe("getTeamStatsHandler", () => {
  it("returns team stats", async () => {
    const result = await Effect.runPromise(
      getTeamStatsHandler(1).pipe(
        Effect.provide(Layer.succeed(FootbalistoService, mockServiceImpl)),
        Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
        Effect.provide(testEnvLayer),
      ),
    );
    expect(result.team_id).toBe(1);
    expect(result.team_name).toBe("KCVV Elewijt A");
    expect(result.wins).toBe(18);
  });
});
