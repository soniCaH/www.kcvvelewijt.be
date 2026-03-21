import { describe, it, expect, vi } from "vitest";
import { Effect, Layer } from "effect";
import {
  getMatchesByTeamHandler,
  getNextMatchesHandler,
  getMatchByIdHandler,
  getMatchDetailHandler,
} from "./matches";
import { HARD_TTL_DEFAULT } from "../cache/kv-cache";
import {
  FootbalistoService,
  type FootbalistoServiceInterface,
} from "../footbalisto/service";
import type { BffError } from "../footbalisto/errors";
import {
  UpstreamUnavailableError,
  ResourceNotFoundError,
} from "../footbalisto/errors";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";
import { WorkerEnvTag } from "../env";
import { testEnvLayer } from "../test-helpers/env-layer";
import type { Match, MatchDetail } from "@kcvv/api-contract";

const baseMatch: Match = {
  id: 1,
  date: new Date("2025-01-15T15:00:00.000Z"),
  time: "15:00",
  home_team: { id: 123, name: "KCVV Elewijt", score: 3 },
  away_team: { id: 456, name: "Opponent FC", score: 1 },
  status: "finished",
  competition: "LEAGUE",
};

const baseDetail: MatchDetail = {
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
  overrides: Partial<FootbalistoServiceInterface> = {},
): FootbalistoServiceInterface {
  return {
    getTeamStats: () => Effect.die("not needed"),
    getTeamMatches: (_teamId) => Effect.succeed([baseMatch]),
    getNextMatches: () => Effect.succeed([baseMatch]),
    getMatchById: (_matchId) => Effect.succeed({ ...baseMatch, id: 99 }),
    getMatchDetail: (_matchId) => Effect.succeed(baseDetail),
    getRanking: () => Effect.die("not needed"),
    ...overrides,
  };
}

function makeCacheMock(): KvCacheInterface {
  return {
    get: () => Effect.succeed(null),
    set: () => Effect.succeed(undefined),
    increment: () => Effect.succeed(undefined),
  };
}

function provide<A>(
  effect: Effect.Effect<
    A,
    BffError,
    FootbalistoService | KvCacheService | WorkerEnvTag
  >,
  overrides: Partial<FootbalistoServiceInterface> = {},
) {
  return effect.pipe(
    Effect.provide(
      Layer.succeed(FootbalistoService, makeServiceMock(overrides)),
    ),
    Effect.provide(Layer.succeed(KvCacheService, makeCacheMock())),
    Effect.provide(testEnvLayer),
  );
}

describe("getMatchesByTeamHandler", () => {
  it("returns matches from FootbalistoService", async () => {
    const result = await Effect.runPromise(provide(getMatchesByTeamHandler(1)));
    expect(result[0]?.id).toBe(1);
    expect(result[0]?.status).toBe("finished");
    expect(result[0]?.home_team.name).toBe("KCVV Elewijt");
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
  it("returns next matches from FootbalistoService (team 23 filter is internal to service)", async () => {
    const result = await Effect.runPromise(provide(getNextMatchesHandler()));
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(1);
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

describe("getMatchDetailHandler", () => {
  it("returns MatchDetail with hasReport", async () => {
    const result = await Effect.runPromise(provide(getMatchDetailHandler(99)));
    expect(result.id).toBe(99);
    expect(result.hasReport).toBe(true);
  });

  it("stores match detail with hardTtl (7 days)", async () => {
    const setCalls: Array<[string, string, number]> = [];
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    await Effect.runPromise(
      getMatchDetailHandler(99).pipe(
        Effect.provide(
          Layer.succeed(FootbalistoService, {
            ...makeServiceMock(),
            getMatchDetail: () =>
              Effect.succeed({ ...baseDetail, date: threeDaysAgo }),
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

describe("getMatchByIdHandler", () => {
  it("returns a basic Match (no lineup)", async () => {
    const result = await Effect.runPromise(
      getMatchByIdHandler(99).pipe(
        Effect.provide(Layer.succeed(FootbalistoService, makeServiceMock())),
      ),
    );
    expect(result.id).toBe(99);
    expect("lineup" in result).toBe(false);
  });
});
