import { describe, expect, it } from "vitest";
import type { MatchDetail } from "@kcvv/api-contract";
import { toHeroMatchData } from "./utils";

// Plain-object cast mirrors the wedstrijd/[matchId] utils test fixture —
// toHeroMatchData only reads fields, so a structural object is sufficient.
function makeMatch(overrides: Partial<MatchDetail> = {}): MatchDetail {
  return {
    id: 12345,
    date: new Date("2026-09-13T15:00:00Z"),
    time: "15:00",
    venue: "Driesstraat",
    home_team: { id: 1235, name: "KCVV Elewijt", logo: "kcvv.png", score: 2 },
    away_team: {
      id: 999,
      name: "Racing Mechelen",
      logo: "racing.png",
      score: 1,
    },
    status: "finished",
    competition: "3e Provinciale",
    is_home: true,
    hasReport: true,
    ...overrides,
  } as MatchDetail;
}

describe("toHeroMatchData", () => {
  it("maps home/away teams, score, competition and kickoff", () => {
    const data = toHeroMatchData(makeMatch());
    expect(data.homeTeam).toEqual({ name: "KCVV Elewijt", logo: "kcvv.png" });
    expect(data.awayTeam).toEqual({
      name: "Racing Mechelen",
      logo: "racing.png",
    });
    expect(data.homeScore).toBe(2);
    expect(data.awayScore).toBe(1);
    expect(data.kickoffTime).toBe("15:00");
    expect(data.competition).toBe("3e Provinciale");
    expect(data.status).toBe("finished");
  });

  it("derives kcvvSide from is_home when present (teamId-driven, never name-based)", () => {
    expect(toHeroMatchData(makeMatch({ is_home: true })).kcvvSide).toBe("home");
    expect(toHeroMatchData(makeMatch({ is_home: false })).kcvvSide).toBe(
      "away",
    );
  });

  it("falls back to the KCVV club id when is_home is absent (getMatchDetail)", () => {
    // getMatchDetail leaves is_home null — derive from the club id (1235).
    const homeKcvv = toHeroMatchData(
      makeMatch({
        is_home: undefined,
        home_team: { id: 1235, name: "KCVV Elewijt", logo: "kcvv.png" },
        away_team: { id: 999, name: "Racing Mechelen", logo: "r.png" },
      }),
    );
    expect(homeKcvv.kcvvSide).toBe("home");

    const awayKcvv = toHeroMatchData(
      makeMatch({
        is_home: undefined,
        home_team: { id: 999, name: "Racing Mechelen", logo: "r.png" },
        away_team: { id: 1235, name: "KCVV Elewijt", logo: "kcvv.png" },
      }),
    );
    expect(awayKcvv.kcvvSide).toBe("away");
  });

  it("leaves kcvvSide undefined when neither side is KCVV and is_home is absent", () => {
    const data = toHeroMatchData(
      makeMatch({
        is_home: undefined,
        home_team: { id: 111, name: "Team A", logo: "a.png" },
        away_team: { id: 222, name: "Team B", logo: "b.png" },
      }),
    );
    expect(data.kcvvSide).toBeUndefined();
  });

  it("formats the match date as a compact Dutch widget date", () => {
    // 2026-09-13 is a Sunday → "Zo 13 september".
    expect(toHeroMatchData(makeMatch()).matchDate).toBe("Zo 13 september");
  });

  it("derives kickoff from the date when `time` is absent (shared extractMatchTime)", () => {
    const data = toHeroMatchData(
      makeMatch({
        time: undefined,
        date: new Date("2026-09-13T19:45:00"),
      }),
    );
    expect(data.kickoffTime).toBe("19:45");
  });

  it("leaves scores undefined for an unplayed (preview) match", () => {
    const data = toHeroMatchData(
      makeMatch({
        status: "scheduled",
        home_team: { id: 1235, name: "KCVV Elewijt", logo: "kcvv.png" },
        away_team: { id: 999, name: "Racing Mechelen", logo: "racing.png" },
      }),
    );
    expect(data.homeScore).toBeUndefined();
    expect(data.awayScore).toBeUndefined();
    expect(data.kickoffTime).toBe("15:00");
  });
});
