import { describe, it, expect } from "vitest";
import { Schema as S } from "effect";
import { PlayerStats, TeamStats } from "./stats";

const validPlayerStats = {
  player_id: 101,
  player_name: "Jan Janssens",
  team_id: 1,
  matches_played: 18,
  goals: 12,
  assists: 5,
  yellow_cards: 2,
  red_cards: 0,
  minutes_played: 1440,
};

const validTeamStats = {
  team_id: 1,
  team_name: "KCVV Elewijt",
  total_matches: 20,
  wins: 14,
  draws: 3,
  losses: 3,
  goals_scored: 45,
  goals_conceded: 18,
  clean_sheets: 8,
  top_scorers: [validPlayerStats],
};

describe("PlayerStats schema", () => {
  it("decodes valid PlayerStats", () => {
    const result = S.decodeUnknownSync(PlayerStats)(validPlayerStats);
    expect(result.player_id).toBe(101);
    expect(result.goals).toBe(12);
    expect(result.assists).toBe(5);
  });

  it("decodes without optional fields", () => {
    const minimal = {
      player_id: 1,
      player_name: "Test",
      team_id: 1,
      matches_played: 0,
      goals: 0,
    };
    const result = S.decodeUnknownSync(PlayerStats)(minimal);
    expect(result.assists).toBeUndefined();
    expect(result.minutes_played).toBeUndefined();
  });

  it("throws on numeric field type violation", () => {
    const invalid = { ...validPlayerStats, goals: "twelve" };
    expect(() => S.decodeUnknownSync(PlayerStats)(invalid)).toThrow();
  });
});

describe("TeamStats schema", () => {
  it("decodes valid TeamStats", () => {
    const result = S.decodeUnknownSync(TeamStats)(validTeamStats);
    expect(result.team_id).toBe(1);
    expect(result.wins).toBe(14);
    expect(result.top_scorers).toHaveLength(1);
    expect(result.top_scorers![0].goals).toBe(12);
  });

  it("decodes without optional fields", () => {
    const { clean_sheets: _, top_scorers: __, ...minimal } = validTeamStats;
    const result = S.decodeUnknownSync(TeamStats)(minimal);
    expect(result.clean_sheets).toBeUndefined();
    expect(result.top_scorers).toBeUndefined();
  });

  it("throws on numeric field type violation", () => {
    const invalid = { ...validTeamStats, wins: "fourteen" };
    expect(() => S.decodeUnknownSync(TeamStats)(invalid)).toThrow();
  });
});
