import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { getTeamStatsHandler } from "./stats";
import {
  FootbalistoClient,
  type FootbalistoClientInterface,
} from "../footbalisto/client";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";

const mockStats = {
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

function makeClientMock(): FootbalistoClientInterface {
  return {
    getRawMatches: () => Effect.succeed([]),
    getRawNextMatches: () => Effect.succeed([]),
    getRawMatchDetail: () => Effect.fail(new Error("not needed") as never),
    getRawRanking: () => Effect.succeed([]),
    getRawTeamStats: (_teamId) => Effect.succeed(mockStats),
    getRawTeams: () => Effect.succeed([]),
    getRawMembers: () => Effect.succeed([]),
  };
}

const cacheMock: KvCacheInterface = {
  get: () => Effect.succeed(null),
  set: () => Effect.succeed(undefined),
  increment: () => Effect.succeed(undefined),
};

describe("getTeamStatsHandler", () => {
  it("returns team stats", async () => {
    const result = await Effect.runPromise(
      getTeamStatsHandler(1).pipe(
        Effect.provide(Layer.succeed(FootbalistoClient, makeClientMock())),
        Effect.provide(Layer.succeed(KvCacheService, cacheMock)),
      ),
    );
    expect(result.team_id).toBe(1);
    expect(result.team_name).toBe("KCVV Elewijt A");
    expect(result.wins).toBe(18);
  });
});
