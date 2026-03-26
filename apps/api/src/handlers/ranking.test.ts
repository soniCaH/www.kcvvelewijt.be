import { describe, it, expect } from "vitest";
import { Effect, Layer, Schema as S } from "effect";
import { getRankingHandler } from "./ranking";
import {
  FootbalistoService,
  type FootbalistoServiceInterface,
} from "../footbalisto/service";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";
import { testEnvLayer } from "../test-helpers/env-layer";
import { RankingArray, type RankingEntry } from "@kcvv/api-contract";
import { UpstreamUnavailableError } from "../footbalisto/errors";

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
    expect(() => S.decodeUnknownSync(RankingArray)(result)).not.toThrow();
  });

  it("fails with ResourceNotFoundError when service returns empty ranking", async () => {
    const result = await Effect.runPromise(
      Effect.either(
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
        getRankingHandler(1, "https://cdn.example.com").pipe(
          Effect.provide(
            Layer.succeed(
              FootbalistoService,
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
