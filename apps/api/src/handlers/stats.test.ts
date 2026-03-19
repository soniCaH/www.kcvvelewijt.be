import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { getTeamStatsHandler } from "./stats";
import {
  FootbalistoService,
  type FootbalistoServiceInterface,
} from "../footbalisto/service";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";

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

describe("getTeamStatsHandler", () => {
  it("returns team stats", async () => {
    const result = await Effect.runPromise(
      getTeamStatsHandler(1).pipe(
        Effect.provide(Layer.succeed(FootbalistoService, mockServiceImpl)),
        Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
      ),
    );
    expect(result.team_id).toBe(1);
    expect(result.team_name).toBe("KCVV Elewijt A");
    expect(result.wins).toBe(18);
  });
});
