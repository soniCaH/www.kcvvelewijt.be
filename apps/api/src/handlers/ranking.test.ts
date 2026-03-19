import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { getRankingHandler } from "./ranking";
import {
  FootbalistoService,
  type FootbalistoServiceInterface,
} from "../footbalisto/service";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";
import { WorkerEnvTag } from "../env";
import type { RankingEntry } from "@kcvv/api-contract";

const rankingEntries: readonly RankingEntry[] = [
  {
    position: 1,
    team_id: 101,
    team_name: "KCVV Elewijt",
    team_logo: "https://cdn.example.com/extra_groot/123.png",
    played: 20,
    won: 15,
    drawn: 3,
    lost: 2,
    goals_for: 45,
    goals_against: 20,
    goal_difference: 25,
    points: 48,
    form: undefined,
  },
];

function makeServiceMock(
  overrides: Partial<FootbalistoServiceInterface> = {},
): FootbalistoServiceInterface {
  return {
    getTeamStats: () => Effect.fail(new Error("not needed") as never),
    getTeamMatches: () => Effect.fail(new Error("not needed") as never),
    getNextMatches: () => Effect.fail(new Error("not needed") as never),
    getMatchById: () => Effect.fail(new Error("not needed") as never),
    getMatchDetail: () => Effect.fail(new Error("not needed") as never),
    getRanking: () => Effect.succeed(rankingEntries),
    ...overrides,
  };
}

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

describe("getRankingHandler", () => {
  it("yields FootbalistoService and returns ranking entries", async () => {
    const result = await Effect.runPromise(
      getRankingHandler(1, "https://cdn.example.com").pipe(
        Effect.provide(Layer.succeed(FootbalistoService, makeServiceMock())),
        Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
        Effect.provide(testEnvLayer),
      ),
    );
    expect(result[0]?.position).toBe(1);
    expect(result[0]?.team_name).toBe("KCVV Elewijt");
    expect(result[0]?.points).toBe(48);
  });

  it("returns empty array when service returns empty", async () => {
    const result = await Effect.runPromise(
      getRankingHandler(1, "https://cdn.example.com").pipe(
        Effect.provide(
          Layer.succeed(
            FootbalistoService,
            makeServiceMock({
              getRanking: () => Effect.succeed([]),
            }),
          ),
        ),
        Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
        Effect.provide(testEnvLayer),
      ),
    );
    expect(result).toHaveLength(0);
  });
});
