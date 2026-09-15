import { describe, it, expect } from "vitest";
import { Effect, Layer, Schema as S } from "effect";
import { getRankingHandler } from "./ranking";
import { PsdService, type PsdServiceInterface } from "../psd/service";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";
import { testEnvLayer } from "../test-helpers/env-layer";
import { PsdGateTest } from "../psd/gate";
import { RankingTableArray, type RankingTable } from "@kcvv/api-contract";
import { UpstreamUnavailableError } from "../psd/errors";

const rankingTables: readonly RankingTable[] = [
  {
    competition_id: 222464,
    competition_name: "3de Afdeling Voetb Vl A",
    entries: [
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
    ],
  },
];

function makeServiceMock(
  overrides: Partial<PsdServiceInterface> = {},
): PsdServiceInterface {
  return {
    getTeamMatches: () => Effect.fail(new Error("not needed") as never),
    getNextMatches: () => Effect.fail(new Error("not needed") as never),
    getMatchesWindow: () => Effect.fail(new Error("not needed") as never),
    getMatchDetail: () => Effect.fail(new Error("not needed") as never),
    getRanking: () => Effect.succeed(rankingTables),
    getOpponentHistory: () => Effect.die("not needed"),
    getPlayerStats: () => Effect.die("not needed"),
    getCurrentSeasonId: () => Effect.succeed(123),
    ...overrides,
  };
}

const cacheMock: KvCacheInterface = {
  get: () => Effect.succeed(null),
  set: () => Effect.succeed(undefined),
  delete: () => Effect.succeed(undefined),
  increment: () => Effect.succeed(undefined),
};

describe("getRankingHandler", () => {
  it("yields PsdService and returns every ranking table", async () => {
    const result = await Effect.runPromise(
      getRankingHandler(1).pipe(
        Effect.provide(Layer.succeed(PsdService, makeServiceMock())),
        Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
        Effect.provide(PsdGateTest),
        Effect.provide(testEnvLayer),
      ),
    );
    expect(result[0]?.competition_id).toBe(222464);
    expect(result[0]?.competition_name).toBe("3de Afdeling Voetb Vl A");
    expect(result[0]?.entries[0]?.position).toBe(1);
    expect(result[0]?.entries[0]?.team_name).toBe("KCVV Elewijt");
    expect(result[0]?.entries[0]?.points).toBe(48);
    expect(() => S.decodeUnknownSync(RankingTableArray)(result)).not.toThrow();
  });

  it("fails with ResourceNotFoundError when the team publishes no table", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        getRankingHandler(1).pipe(
          Effect.provide(
            Layer.succeed(
              PsdService,
              makeServiceMock({
                getRanking: () => Effect.succeed([]),
              }),
            ),
          ),
          Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
          Effect.provide(PsdGateTest),
          Effect.provide(testEnvLayer),
        ),
      ),
    );
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("ResourceNotFound");
    }
  });

  it("propagates UpstreamUnavailableError from service", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        getRankingHandler(1).pipe(
          Effect.provide(
            Layer.succeed(
              PsdService,
              makeServiceMock({
                getRanking: () =>
                  Effect.fail(
                    new UpstreamUnavailableError({
                      message: "PSD returned 503",
                      status: 503,
                    }),
                  ),
              }),
            ),
          ),
          Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
          Effect.provide(PsdGateTest),
          Effect.provide(testEnvLayer),
        ),
      ),
    );
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UpstreamUnavailable");
    }
  });
});
