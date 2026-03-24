import { describe, it, expect } from "vitest";
import { Effect, Layer, Schema as S } from "effect";
import { getTeamStatsHandler } from "./stats";
import {
  FootbalistoService,
  type FootbalistoServiceInterface,
} from "../footbalisto/service";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";
import { testEnvLayer } from "../test-helpers/env-layer";
import {
  UpstreamUnavailableError,
  ResourceNotFoundError,
} from "../footbalisto/errors";
import { TeamStats } from "@kcvv/api-contract";

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

function provide<A>(
  effect: Effect.Effect<
    A,
    import("../footbalisto/errors").BffError,
    FootbalistoService | KvCacheService | import("../env").WorkerEnvTag
  >,
  overrides: Partial<FootbalistoServiceInterface> = {},
) {
  return Effect.either(
    effect.pipe(
      Effect.provide(
        Layer.succeed(FootbalistoService, { ...mockServiceImpl, ...overrides }),
      ),
      Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
      Effect.provide(testEnvLayer),
    ),
  );
}

describe("getTeamStatsHandler", () => {
  it("returns team stats", async () => {
    const result = await Effect.runPromise(provide(getTeamStatsHandler(1)));
    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right.team_id).toBe(1);
      expect(result.right.team_name).toBe("KCVV Elewijt A");
      expect(result.right.wins).toBe(18);
      expect(() => S.decodeUnknownSync(TeamStats)(result.right)).not.toThrow();
    }
  });

  it("propagates UpstreamUnavailableError from service", async () => {
    const result = await Effect.runPromise(
      provide(getTeamStatsHandler(1), {
        getTeamStats: () =>
          Effect.fail(
            new UpstreamUnavailableError({
              message: "PSD returned 503",
              status: 503,
            }),
          ),
      }),
    );
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UpstreamUnavailable");
    }
  });

  it("propagates ResourceNotFoundError from service", async () => {
    const result = await Effect.runPromise(
      provide(getTeamStatsHandler(999), {
        getTeamStats: () =>
          Effect.fail(
            new ResourceNotFoundError({
              message: "Team not found",
              resourceType: "team-stats",
              resourceId: 999,
            }),
          ),
      }),
    );
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("ResourceNotFound");
    }
  });
});
