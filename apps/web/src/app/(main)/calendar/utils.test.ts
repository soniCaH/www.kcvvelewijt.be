/**
 * Calendar Utils Tests
 */

import { describe, it, expect } from "vitest";
import { transformMatchToCalendar } from "./utils";
import type { Match } from "@/lib/effect/schemas/match.schema";

function createMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 100,
    date: new Date("2026-03-28T14:00:00Z"),
    time: "14:00",
    home_team: { id: 1, name: "KCVV Elewijt", logo: "/kcvv.png", score: 2 },
    away_team: { id: 2, name: "KFC Turnhout", logo: "/kfc.png", score: 1 },
    status: "finished",
    competition: "2e Nationale",
    kcvv_team_label: "A-Ploeg",
    ...overrides,
  } as Match;
}

describe("transformMatchToCalendar", () => {
  it("maps all fields correctly", () => {
    const match = createMatch();
    const result = transformMatchToCalendar(match);

    expect(result).toEqual({
      id: 100,
      date: "2026-03-28T14:00:00.000Z",
      time: "14:00",
      homeTeam: { id: 1, name: "KCVV Elewijt", logo: "/kcvv.png" },
      awayTeam: { id: 2, name: "KFC Turnhout", logo: "/kfc.png" },
      homeScore: 2,
      awayScore: 1,
      scoreDisplay: { type: "score", home: 2, away: 1 },
      status: "finished",
      competition: "2e Nationale",
      team: "A-Ploeg",
    });
  });

  it("renames kcvv_team_label to team", () => {
    const match = createMatch({ kcvv_team_label: "U21" });
    const result = transformMatchToCalendar(match);

    expect(result.team).toBe("U21");
  });

  it("serializes date to ISO string", () => {
    const match = createMatch({
      date: new Date("2026-06-15T18:30:00Z"),
    });
    const result = transformMatchToCalendar(match);

    expect(result.date).toBe("2026-06-15T18:30:00.000Z");
  });

  it("passes through undefined scores", () => {
    const match = createMatch({
      home_team: { id: 1, name: "KCVV Elewijt" },
      away_team: { id: 2, name: "KFC Turnhout" },
      status: "scheduled",
    });
    const result = transformMatchToCalendar(match);

    expect(result.homeScore).toBeUndefined();
    expect(result.awayScore).toBeUndefined();
    expect(result.scoreDisplay).toEqual({ type: "vs" });
  });
});
