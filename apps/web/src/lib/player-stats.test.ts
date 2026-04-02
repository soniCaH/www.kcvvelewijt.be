import { describe, it, expect } from "vitest";
import { toOutfieldPlayerStatsData } from "./player-stats";
import type { PlayerTeamStats } from "@kcvv/api-contract";

describe("toOutfieldPlayerStatsData", () => {
  it("transforms a single team's stats to OutfieldStats", () => {
    const teams: PlayerTeamStats[] = [
      {
        team: "A-team",
        gamesPlayed: 10,
        gamesWon: 5,
        gamesEqual: 3,
        gamesLost: 2,
        goals: 4,
        assists: 2,
        yellowCards: 1,
        redCards: 0,
        minutes: 900,
      },
    ];

    const result = toOutfieldPlayerStatsData(teams);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      season: "A-team",
      matches: 10,
      goals: 4,
      assists: 2,
      yellowCards: 1,
      redCards: 0,
      minutesPlayed: 900,
    });
  });

  it("transforms multiple teams into separate rows", () => {
    const teams: PlayerTeamStats[] = [
      {
        team: "A-team",
        gamesPlayed: 8,
        gamesWon: 4,
        gamesEqual: 2,
        gamesLost: 2,
        goals: 3,
        assists: 1,
        yellowCards: 0,
        redCards: 0,
        minutes: 720,
      },
      {
        team: "B-team",
        gamesPlayed: 5,
        gamesWon: 2,
        gamesEqual: 1,
        gamesLost: 2,
        goals: 1,
        assists: 0,
        yellowCards: 2,
        redCards: 1,
        minutes: 450,
      },
    ];

    const result = toOutfieldPlayerStatsData(teams);

    expect(result).toHaveLength(2);
    expect(result[0]?.season).toBe("A-team");
    expect(result[1]?.season).toBe("B-team");
  });

  it("returns empty array for empty teams", () => {
    expect(toOutfieldPlayerStatsData([])).toEqual([]);
  });
});
