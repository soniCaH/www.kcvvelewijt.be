/**
 * Match Detail Page Utils Tests
 */

import { describe, it, expect } from "vitest";
import {
  transformHomeTeam,
  transformAwayTeam,
  transformLineupPlayer,
  extractMatchTime,
  formatMatchTitle,
  formatMatchDescription,
} from "./utils";
import type {
  MatchDetail,
  MatchLineupPlayer,
} from "@/lib/effect/schemas/match.schema";

// Helper to create a minimal valid MatchDetail
function createMatchDetail(overrides: Partial<MatchDetail> = {}): MatchDetail {
  return {
    id: 12345,
    date: new Date("2025-12-07T15:00:00"),
    home_team: { id: 1, name: "KCVV Elewijt" },
    away_team: { id: 2, name: "KFC Turnhout" },
    status: "scheduled",
    hasReport: false,
    ...overrides,
  } as MatchDetail;
}

describe("transformHomeTeam", () => {
  it("transforms home team data", () => {
    const match = createMatchDetail({
      home_team: { id: 1, name: "KCVV Elewijt", logo: "/logo.png", score: 3 },
    });
    const result = transformHomeTeam(match);
    expect(result).toEqual({
      name: "KCVV Elewijt",
      logo: "/logo.png",
      score: 3,
    });
  });

  it("handles missing logo and score", () => {
    const match = createMatchDetail({
      home_team: { id: 1, name: "KCVV Elewijt" },
    });
    const result = transformHomeTeam(match);
    expect(result).toEqual({
      name: "KCVV Elewijt",
      logo: undefined,
      score: undefined,
    });
  });
});

describe("transformAwayTeam", () => {
  it("transforms away team data", () => {
    const match = createMatchDetail({
      away_team: {
        id: 2,
        name: "KFC Turnhout",
        logo: "/away-logo.png",
        score: 1,
      },
    });
    const result = transformAwayTeam(match);
    expect(result).toEqual({
      name: "KFC Turnhout",
      logo: "/away-logo.png",
      score: 1,
    });
  });

  it("handles missing logo and score", () => {
    const match = createMatchDetail({
      away_team: { id: 2, name: "KFC Turnhout" },
    });
    const result = transformAwayTeam(match);
    expect(result).toEqual({
      name: "KFC Turnhout",
      logo: undefined,
      score: undefined,
    });
  });
});

describe("transformLineupPlayer", () => {
  it("transforms lineup player with all fields", () => {
    const player: MatchLineupPlayer = {
      id: 1,
      name: "Player Name",
      number: 10,
      minutesPlayed: 90,
      isCaptain: true,
      status: "starter",
    } as MatchLineupPlayer;

    const result = transformLineupPlayer(player);
    expect(result).toEqual({
      id: 1,
      name: "Player Name",
      number: 10,
      minutesPlayed: 90,
      isCaptain: true,
      status: "starter",
    });
  });

  it("handles minimal player data", () => {
    const player: MatchLineupPlayer = {
      name: "Player Name",
      isCaptain: false,
      status: "substitute",
    } as MatchLineupPlayer;

    const result = transformLineupPlayer(player);
    expect(result).toEqual({
      id: undefined,
      name: "Player Name",
      number: undefined,
      minutesPlayed: undefined,
      isCaptain: false,
      status: "substitute",
    });
  });

  it("handles substituted status", () => {
    const player: MatchLineupPlayer = {
      id: 5,
      name: "Subbed Player",
      number: 9,
      minutesPlayed: 75,
      isCaptain: false,
      status: "substituted",
    } as MatchLineupPlayer;

    const result = transformLineupPlayer(player);
    expect(result.status).toBe("substituted");
    expect(result.minutesPlayed).toBe(75);
  });
});

describe("extractMatchTime", () => {
  it("returns provided time if available", () => {
    const match = createMatchDetail({ time: "15:00" });
    expect(extractMatchTime(match)).toBe("15:00");
  });

  it("extracts time from date when time not provided", () => {
    const match = createMatchDetail({
      date: new Date("2025-12-07T15:30:00"),
      time: undefined,
    });
    expect(extractMatchTime(match)).toBe("15:30");
  });

  it("returns undefined for midnight time (likely no time set)", () => {
    const match = createMatchDetail({
      date: new Date("2025-12-07T00:00:00"),
      time: undefined,
    });
    expect(extractMatchTime(match)).toBeUndefined();
  });

  it("handles single digit hours and minutes", () => {
    const match = createMatchDetail({
      date: new Date("2025-12-07T09:05:00"),
      time: undefined,
    });
    expect(extractMatchTime(match)).toBe("09:05");
  });
});

describe("formatMatchTitle", () => {
  it("formats scheduled match title", () => {
    const match = createMatchDetail();
    expect(formatMatchTitle(match)).toBe("KCVV Elewijt vs KFC Turnhout");
  });

  it("formats finished match title with score", () => {
    const match = createMatchDetail({
      status: "finished",
      home_team: { id: 1, name: "KCVV Elewijt", score: 3 },
      away_team: { id: 2, name: "KFC Turnhout", score: 1 },
    });
    expect(formatMatchTitle(match)).toBe("KCVV Elewijt 3 - 1 KFC Turnhout");
  });

  it("formats forfeited match without score as VS", () => {
    const match = createMatchDetail({ status: "forfeited" });
    // Forfeited but no score - shows VS
    expect(formatMatchTitle(match)).toBe("KCVV Elewijt vs KFC Turnhout");
  });

  it("formats forfeited match with score showing numeric result", () => {
    const match = createMatchDetail({
      status: "forfeited",
      home_team: { id: 1, name: "KCVV Elewijt", score: 2 },
      away_team: { id: 2, name: "KFC Turnhout", score: 1 },
    });
    expect(formatMatchTitle(match)).toBe("KCVV Elewijt 2 - 1 KFC Turnhout");
  });

  it("formats draw correctly", () => {
    const match = createMatchDetail({
      status: "finished",
      home_team: { id: 1, name: "KCVV Elewijt", score: 2 },
      away_team: { id: 2, name: "KFC Turnhout", score: 2 },
    });
    expect(formatMatchTitle(match)).toBe("KCVV Elewijt 2 - 2 KFC Turnhout");
  });

  it("formats high-scoring match correctly", () => {
    const match = createMatchDetail({
      status: "finished",
      home_team: { id: 1, name: "KCVV Elewijt", score: 7 },
      away_team: { id: 2, name: "Opponent FC", score: 0 },
    });
    expect(formatMatchTitle(match)).toBe("KCVV Elewijt 7 - 0 Opponent FC");
  });

  it("falls back to VS format when away score is undefined", () => {
    const match = createMatchDetail({
      status: "finished",
      home_team: { id: 1, name: "KCVV Elewijt", score: 3 },
      away_team: { id: 2, name: "KFC Turnhout", score: undefined },
    });
    // Should not include "undefined" in title
    expect(formatMatchTitle(match)).toBe("KCVV Elewijt vs KFC Turnhout");
  });

  it("falls back to VS format when home score is undefined", () => {
    const match = createMatchDetail({
      status: "finished",
      home_team: { id: 1, name: "KCVV Elewijt", score: undefined },
      away_team: { id: 2, name: "KFC Turnhout", score: 1 },
    });
    // Should not include "undefined" in title
    expect(formatMatchTitle(match)).toBe("KCVV Elewijt vs KFC Turnhout");
  });
});

describe("formatMatchDescription", () => {
  it("formats match description with competition", () => {
    const match = createMatchDetail({ competition: "3de Nationale" });
    const result = formatMatchDescription(match);
    expect(result).toContain("KCVV Elewijt vs KFC Turnhout");
    expect(result).toContain("3de Nationale");
    expect(result).toContain("2025");
  });

  it("uses 'Wedstrijd' when no competition", () => {
    const match = createMatchDetail({ competition: undefined });
    const result = formatMatchDescription(match);
    expect(result).toContain("Wedstrijd");
  });

  it("includes date in Dutch locale", () => {
    const match = createMatchDetail({
      date: new Date("2025-12-07T15:00:00"),
    });
    const result = formatMatchDescription(match);
    // Should contain Dutch date formatting
    expect(result).toContain("december");
    expect(result).toContain("2025");
  });

  it("formats finished match description with score", () => {
    const match = createMatchDetail({
      status: "finished",
      home_team: { id: 1, name: "KCVV Elewijt", score: 3 },
      away_team: { id: 2, name: "KFC Turnhout", score: 1 },
      competition: "3de Nationale",
    });
    const result = formatMatchDescription(match);
    expect(result).toContain("3 - 1");
  });
});
