/**
 * Tests for team detail utility functions
 */

import { describe, it, expect } from "vitest";
import { transformMatchToSchedule, transformRankingToStandings } from "./utils";
import type { Match, RankingEntry } from "@/lib/effect/schemas";

// Mock Match factory
function createMockMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 123,
    date: new Date("2025-02-15T15:00:00"),
    time: "15:00",
    home_team: {
      id: 1,
      name: "KCVV Elewijt",
      logo: "https://example.com/kcvv.png",
      score: 2,
    },
    away_team: {
      id: 2,
      name: "FC Opponent",
      logo: "https://example.com/opponent.png",
      score: 1,
    },
    status: "finished",
    competition: "3e Nationale",
    ...overrides,
  } as Match;
}

// Mock RankingEntry factory
function createMockRankingEntry(
  overrides: Partial<RankingEntry> = {},
): RankingEntry {
  return {
    position: 1,
    team_id: 1,
    team_name: "KCVV Elewijt",
    team_logo: "https://example.com/kcvv.png",
    played: 15,
    won: 10,
    drawn: 3,
    lost: 2,
    goals_for: 35,
    goals_against: 12,
    goal_difference: 23,
    points: 33,
    form: "WWDWL",
    ...overrides,
  } as RankingEntry;
}

describe("transformMatchToSchedule", () => {
  it("transforms a match to schedule format", () => {
    const match = createMockMatch();
    const result = transformMatchToSchedule(match);

    expect(result.id).toBe(123);
    expect(result.date).toEqual(new Date("2025-02-15T15:00:00"));
    expect(result.time).toBe("15:00");
    expect(result.homeTeam.id).toBe(1);
    expect(result.homeTeam.name).toBe("KCVV Elewijt");
    expect(result.homeTeam.logo).toBe("https://example.com/kcvv.png");
    expect(result.awayTeam.id).toBe(2);
    expect(result.awayTeam.name).toBe("FC Opponent");
    expect(result.homeScore).toBe(2);
    expect(result.awayScore).toBe(1);
    expect(result.status).toBe("finished");
    expect(result.competition).toBe("3e Nationale");
  });

  it("handles scheduled match without scores", () => {
    const match = createMockMatch({
      status: "scheduled",
      home_team: { id: 1, name: "KCVV", score: undefined },
      away_team: { id: 2, name: "Opponent", score: undefined },
    });
    const result = transformMatchToSchedule(match);

    expect(result.status).toBe("scheduled");
    expect(result.homeScore).toBeUndefined();
    expect(result.awayScore).toBeUndefined();
  });

  it("handles match without logos", () => {
    const match = createMockMatch({
      home_team: { id: 1, name: "KCVV", logo: undefined },
      away_team: { id: 2, name: "Opponent", logo: undefined },
    });
    const result = transformMatchToSchedule(match);

    expect(result.homeTeam.logo).toBeUndefined();
    expect(result.awayTeam.logo).toBeUndefined();
  });

  it("passes is_home through as isHome when present", () => {
    const homeMatch = createMockMatch({ is_home: true });
    expect(transformMatchToSchedule(homeMatch).isHome).toBe(true);

    const awayMatch = createMockMatch({ is_home: false });
    expect(transformMatchToSchedule(awayMatch).isHome).toBe(false);
  });

  it("leaves isHome undefined when is_home is absent", () => {
    const match = createMockMatch();
    expect(transformMatchToSchedule(match).isHome).toBeUndefined();
  });
});

describe("transformRankingToStandings", () => {
  it("transforms a ranking entry to standings format", () => {
    const entry = createMockRankingEntry();
    const result = transformRankingToStandings(entry);

    expect(result.position).toBe(1);
    expect(result.teamId).toBe(1);
    expect(result.teamName).toBe("KCVV Elewijt");
    expect(result.teamLogo).toBe("https://example.com/kcvv.png");
    expect(result.played).toBe(15);
    expect(result.won).toBe(10);
    expect(result.drawn).toBe(3);
    expect(result.lost).toBe(2);
    expect(result.goalsFor).toBe(35);
    expect(result.goalsAgainst).toBe(12);
    expect(result.goalDifference).toBe(23);
    expect(result.points).toBe(33);
  });

  it("handles entry without logo", () => {
    const entry = createMockRankingEntry({ team_logo: undefined });
    const result = transformRankingToStandings(entry);

    expect(result.teamLogo).toBeUndefined();
  });
});
