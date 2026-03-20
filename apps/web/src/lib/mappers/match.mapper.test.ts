/**
 * Match Mapper Tests
 */

import { describe, it, expect } from "vitest";
import {
  mapMatchToUpcomingMatch,
  mapMatchesToUpcomingMatches,
} from "./match.mapper";
import type { Match } from "@/lib/effect/schemas/match.schema";

describe("mapMatchToUpcomingMatch", () => {
  it("should map a scheduled match correctly", () => {
    const match: Match = {
      id: 1,
      date: new Date("2025-12-06T09:00:00"),
      time: "09:00",
      venue: undefined,
      home_team: {
        id: 448,
        name: "Londerzeel United",
        logo: "https://example.com/logo1.png",
      },
      away_team: {
        id: 1235,
        name: "Kcvv Elewijt",
        logo: "https://example.com/logo2.png",
      },
      status: "scheduled",
      round: "U9",
      competition: "Competitie",
    };

    const result = mapMatchToUpcomingMatch(match);

    expect(result).toEqual({
      id: 1,
      date: new Date("2025-12-06T09:00:00"),
      time: "09:00",
      venue: undefined,
      homeTeam: {
        id: 448,
        name: "Londerzeel United",
        logo: "https://example.com/logo1.png",
        score: undefined,
      },
      awayTeam: {
        id: 1235,
        name: "KCVV Elewijt", // Note: Kcvv should be capitalized to KCVV
        logo: "https://example.com/logo2.png",
        score: undefined,
      },
      status: "scheduled",
      round: "U9",
      competition: "Competitie",
    });
  });

  it("should normalize KCVV team name capitalization", () => {
    const match: Match = {
      id: 2,
      date: new Date("2025-12-07T15:00:00"),
      time: "15:00",
      venue: undefined,
      home_team: {
        id: 1235,
        name: "Kcvv Elewijt",
        logo: "https://example.com/logo.png",
      },
      away_team: {
        id: 59,
        name: "Kfc Turnhout",
        logo: "https://example.com/logo2.png",
      },
      status: "scheduled",
      round: "A-ploeg",
      competition: "Competitie",
    };

    const result = mapMatchToUpcomingMatch(match);

    expect(result.homeTeam.name).toBe("KCVV Elewijt");
    expect(result.awayTeam.name).toBe("Kfc Turnhout");
  });

  it("should map a forfeited match with scores correctly", () => {
    const match: Match = {
      id: 10,
      date: new Date(),
      time: "15:30",
      venue: undefined,
      home_team: {
        id: 1235,
        name: "KCVV Elewijt",
        logo: "https://example.com/logo.png",
        score: 2,
      },
      away_team: {
        id: 628,
        name: "Vc Bertem-leefdaal",
        logo: "https://example.com/logo2.png",
        score: 1,
      },
      status: "forfeited",
      round: "U15",
      competition: "Competitie",
    };

    const result = mapMatchToUpcomingMatch(match);

    expect(result.homeTeam.score).toBe(2);
    expect(result.awayTeam.score).toBe(1);
    expect(result.status).toBe("forfeited");
  });

  it("should handle postponed status", () => {
    const match: Match = {
      id: 12,
      date: new Date("2025-12-15T15:00:00"),
      time: undefined,
      venue: undefined,
      home_team: {
        id: 1235,
        name: "KCVV Elewijt",
        logo: "https://example.com/logo.png",
      },
      away_team: {
        id: 872,
        name: "Zennester Hombeek",
        logo: "https://example.com/logo2.png",
      },
      status: "postponed",
      round: "U13",
      competition: "Competitie",
    };

    const result = mapMatchToUpcomingMatch(match);

    expect(result.status).toBe("postponed");
  });

  it("should map kcvv_team_id and kcvv_team_label", () => {
    const match: Match = {
      id: 42,
      date: new Date("2025-12-06T15:00:00"),
      time: "15:00",
      venue: undefined,
      home_team: {
        id: 1235,
        name: "KCVV Elewijt",
        logo: "https://example.com/logo.png",
      },
      away_team: {
        id: 456,
        name: "Opponent FC",
        logo: "https://example.com/logo2.png",
      },
      status: "scheduled",
      competition: "LEAGUE",
      kcvv_team_id: 7,
      kcvv_team_label: "U21",
    };

    const result = mapMatchToUpcomingMatch(match);

    expect(result.kcvvTeamId).toBe(7);
    expect(result.kcvvTeamLabel).toBe("U21");
  });

  it("should handle stopped status", () => {
    const match: Match = {
      id: 13,
      date: new Date("2025-12-22T14:30:00"),
      time: undefined,
      venue: undefined,
      home_team: {
        id: 230,
        name: "Kcs Machelen",
        logo: "https://example.com/logo.png",
      },
      away_team: {
        id: 1235,
        name: "Kcvv Elewijt",
        logo: "https://example.com/logo2.png",
      },
      status: "stopped",
      round: "U12",
      competition: "Competitie",
    };

    const result = mapMatchToUpcomingMatch(match);

    expect(result.status).toBe("stopped");
    expect(result.awayTeam.name).toBe("KCVV Elewijt");
  });
});

describe("mapMatchesToUpcomingMatches", () => {
  it("should map an array of matches correctly", () => {
    const matches: Match[] = [
      {
        id: 1,
        date: new Date("2025-12-06T09:00:00"),
        time: "09:00",
        venue: undefined,
        home_team: {
          id: 448,
          name: "Londerzeel United",
          logo: "https://example.com/logo1.png",
        },
        away_team: {
          id: 1235,
          name: "Kcvv Elewijt",
          logo: "https://example.com/logo2.png",
        },
        status: "scheduled",
        round: "U9",
        competition: "Competitie",
      },
      {
        id: 2,
        date: new Date("2025-12-07T15:00:00"),
        time: "15:00",
        venue: undefined,
        home_team: {
          id: 1235,
          name: "Kcvv Elewijt",
          logo: "https://example.com/logo.png",
        },
        away_team: {
          id: 59,
          name: "Kfc Turnhout",
          logo: "https://example.com/logo2.png",
        },
        status: "scheduled",
        round: "A-ploeg",
        competition: "Competitie",
      },
    ];

    const result = mapMatchesToUpcomingMatches(matches);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[0].awayTeam.name).toBe("KCVV Elewijt");
    expect(result[1].id).toBe(2);
    expect(result[1].homeTeam.name).toBe("KCVV Elewijt");
  });

  it("should handle empty array", () => {
    const result = mapMatchesToUpcomingMatches([]);
    expect(result).toEqual([]);
  });
});
