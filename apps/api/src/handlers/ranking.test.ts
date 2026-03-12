import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { getRankingHandler } from "./ranking";
import {
  FootbalistoClient,
  type FootbalistoClientInterface,
} from "../footbalisto/client";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";

const rawCompetitions = [
  {
    name: "3de Nationale A",
    type: "LEAGUE",
    teams: [
      {
        id: 1,
        rank: 1,
        matchesPlayed: 20,
        wins: 15,
        draws: 3,
        losses: 2,
        goalsScored: 45,
        goalsConceded: 20,
        points: 48,
        team: {
          id: 101,
          club: { id: 123, localName: "KCVV Elewijt", name: "KCVV Elewijt" },
        },
      },
    ],
  },
  { name: "Beker", type: "CUP", teams: [] }, // should be skipped
];

function makeClientMock(
  overrides: Partial<FootbalistoClientInterface> = {},
): FootbalistoClientInterface {
  return {
    getRawMatches: () => Effect.succeed([]),
    getRawNextMatches: () => Effect.succeed([]),
    getRawMatchDetail: () => Effect.fail(new Error("not needed") as never),
    getRawRanking: () => Effect.succeed(rawCompetitions),
    getRawTeamStats: () => Effect.fail(new Error("not needed") as never),
    getRawTeams: () => Effect.succeed([]),
    getRawMembers: () => Effect.succeed([]),
    getRawStaff: () => Effect.succeed([]),
    ...overrides,
  };
}

const cacheMock: KvCacheInterface = {
  get: () => Effect.succeed(null),
  set: () => Effect.succeed(undefined),
  increment: () => Effect.succeed(undefined),
};

describe("getRankingHandler", () => {
  it("returns ranking from first non-CUP/FRIENDLY competition", async () => {
    const result = await Effect.runPromise(
      getRankingHandler(1, "https://cdn.example.com").pipe(
        Effect.provide(Layer.succeed(FootbalistoClient, makeClientMock())),
        Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
      ),
    );
    expect(result[0]?.position).toBe(1);
    expect(result[0]?.team_name).toBe("KCVV Elewijt");
    expect(result[0]?.points).toBe(48);
  });

  it("returns cached ranking without calling client", async () => {
    const cachedRanking = [
      {
        position: 1,
        team_id: 101,
        team_name: "KCVV Elewijt",
        played: 20,
        won: 15,
        drawn: 3,
        lost: 2,
        goals_for: 45,
        goals_against: 20,
        goal_difference: 25,
        points: 48,
      },
    ];

    const clientShouldNotBeCalled: FootbalistoClientInterface = {
      getRawMatches: () => Effect.fail(new Error("unexpected") as never),
      getRawNextMatches: () => Effect.fail(new Error("unexpected") as never),
      getRawMatchDetail: () => Effect.fail(new Error("unexpected") as never),
      getRawRanking: () => Effect.fail(new Error("unexpected") as never),
      getRawTeamStats: () => Effect.fail(new Error("unexpected") as never),
      getRawTeams: () => Effect.fail(new Error("unexpected") as never),
      getRawMembers: () => Effect.fail(new Error("unexpected") as never),
      getRawStaff: () => Effect.fail(new Error("unexpected") as never),
    };

    const result = await Effect.runPromise(
      getRankingHandler(1, "https://cdn.example.com").pipe(
        Effect.provide(
          Layer.succeed(FootbalistoClient, clientShouldNotBeCalled),
        ),
        Effect.provide(
          Layer.succeed(KvCacheService, {
            get: () => Effect.succeed(JSON.stringify(cachedRanking)),
            set: () => Effect.succeed(undefined),
            increment: () => Effect.succeed(undefined),
          }),
        ),
      ),
    );

    expect(result[0]?.position).toBe(1);
    expect(result[0]?.team_name).toBe("KCVV Elewijt");
  });

  it("falls through to client on corrupted cache", async () => {
    const result = await Effect.runPromise(
      getRankingHandler(1, "https://cdn.example.com").pipe(
        Effect.provide(Layer.succeed(FootbalistoClient, makeClientMock())),
        Effect.provide(
          Layer.succeed(KvCacheService, {
            get: () => Effect.succeed("not-valid-json{{{"),
            set: () => Effect.succeed(undefined),
            increment: () => Effect.succeed(undefined),
          }),
        ),
      ),
    );

    // Should fall through to client and return real data
    expect(result[0]?.position).toBe(1);
    expect(result[0]?.points).toBe(48);
  });

  it("falls through to client on schema-invalid cache (valid JSON, wrong shape)", async () => {
    const result = await Effect.runPromise(
      getRankingHandler(1, "https://cdn.example.com").pipe(
        Effect.provide(Layer.succeed(FootbalistoClient, makeClientMock())),
        Effect.provide(
          Layer.succeed(KvCacheService, {
            // Syntactically valid JSON but does not match RankingArray shape
            get: () => Effect.succeed(JSON.stringify([{ foo: "bar" }])),
            set: () => Effect.succeed(undefined),
            increment: () => Effect.succeed(undefined),
          }),
        ),
      ),
    );

    expect(result[0]?.position).toBe(1);
    expect(result[0]?.points).toBe(48);
  });

  it("returns empty array when no competition has teams", async () => {
    const result = await Effect.runPromise(
      getRankingHandler(1, "https://cdn.example.com").pipe(
        Effect.provide(
          Layer.succeed(
            FootbalistoClient,
            makeClientMock({
              getRawRanking: () =>
                Effect.succeed([{ name: "Cup", type: "CUP", teams: [] }]),
            }),
          ),
        ),
        Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
      ),
    );
    expect(result).toHaveLength(0);
  });
});
