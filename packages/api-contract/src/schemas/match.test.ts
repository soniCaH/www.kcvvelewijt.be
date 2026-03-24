import { describe, it, expect } from "vitest";
import { Schema as S } from "effect";
import { Match, MatchDetail, MatchesArray, MatchStatus } from "./match";

const validMatchTeam = { id: 1, name: "KCVV Elewijt", logo: "/logo.png", score: 2 };
const validAwayTeam = { id: 2, name: "FC Opponent", score: 1 };

const validMatch = {
  id: 123,
  date: "2026-03-15T15:00:00.000Z",
  time: "15:00",
  venue: "Koninklijk Stadion",
  home_team: validMatchTeam,
  away_team: validAwayTeam,
  status: "finished",
  round: "15",
  competition: "2de Nationale",
  kcvv_team_id: 1,
  kcvv_team_label: "A-Ploeg",
};

describe("Match schema", () => {
  it("decodes a valid Match", () => {
    const result = S.decodeUnknownSync(Match)(validMatch);
    expect(result.id).toBe(123);
    expect(result.home_team.name).toBe("KCVV Elewijt");
    expect(result.away_team.score).toBe(1);
    expect(result.status).toBe("finished");
  });

  it("decodes a minimal Match (only required fields)", () => {
    const minimal = {
      id: 1,
      date: "2026-01-01T00:00:00.000Z",
      home_team: { id: 1, name: "Home" },
      away_team: { id: 2, name: "Away" },
      status: "scheduled",
    };
    const result = S.decodeUnknownSync(Match)(minimal);
    expect(result.id).toBe(1);
    expect(result.home_team.logo).toBeUndefined();
    expect(result.time).toBeUndefined();
  });

  it("coerces ISO string to Date in Match.date", () => {
    const result = S.decodeUnknownSync(Match)(validMatch);
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString()).toBe("2026-03-15T15:00:00.000Z");
  });

  it("accepts a Date object for Match.date", () => {
    const withDate = { ...validMatch, date: new Date("2026-03-15T15:00:00.000Z") };
    const result = S.decodeUnknownSync(Match)(withDate);
    expect(result.date).toBeInstanceOf(Date);
  });

  it("throws on invalid MatchStatus value", () => {
    const invalid = { ...validMatch, status: "unknown" };
    expect(() => S.decodeUnknownSync(Match)(invalid)).toThrow();
  });

  it("throws on missing required field", () => {
    const { id: _, ...noId } = validMatch;
    expect(() => S.decodeUnknownSync(Match)(noId)).toThrow();
  });

  it("decodes MatchesArray", () => {
    const result = S.decodeUnknownSync(MatchesArray)([validMatch]);
    expect(result).toHaveLength(1);
  });
});

describe("MatchStatus schema", () => {
  it.each(["scheduled", "finished", "forfeited", "postponed", "stopped"] as const)(
    "accepts '%s'",
    (status) => {
      expect(() => S.decodeUnknownSync(MatchStatus)(status)).not.toThrow();
    },
  );

  it("rejects invalid status", () => {
    expect(() => S.decodeUnknownSync(MatchStatus)("invalid")).toThrow();
  });
});

describe("MatchDetail schema", () => {
  const validDetail = {
    ...validMatch,
    hasReport: true,
  };

  it("decodes a valid MatchDetail without lineup", () => {
    const result = S.decodeUnknownSync(MatchDetail)(validDetail);
    expect(result.id).toBe(123);
    expect(result.hasReport).toBe(true);
    expect(result.lineup).toBeUndefined();
  });

  it("decodes a valid MatchDetail with lineup", () => {
    const withLineup = {
      ...validDetail,
      lineup: {
        home: [
          {
            name: "Jan Janssens",
            number: 1,
            isCaptain: true,
            isKeeper: true,
            status: "starter",
            minutesPlayed: 90,
          },
        ],
        away: [
          {
            name: "Piet Pieters",
            isCaptain: false,
            status: "substitute",
            card: "yellow",
          },
        ],
      },
    };
    const result = S.decodeUnknownSync(MatchDetail)(withLineup);
    expect(result.lineup?.home).toHaveLength(1);
    expect(result.lineup?.home[0].isCaptain).toBe(true);
    expect(result.lineup?.away[0].card).toBe("yellow");
  });

  it("throws on missing hasReport", () => {
    expect(() => S.decodeUnknownSync(MatchDetail)(validMatch)).toThrow();
  });
});
