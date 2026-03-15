import { describe, it, expect } from "vitest";
import {
  transformFootbalistoMatch,
  transformFootbalistoMatchDetail,
  transformFootbalistoRankingEntry,
} from "./transforms";
import type {
  FootbalistoMatch,
  FootbalistoRankingEntry,
  FootbalistoMatchDetailResponse,
} from "./schemas";

const rawMatch: FootbalistoMatch = {
  id: 42,
  teamId: 1,
  teamName: "KCVV Elewijt A",
  timestamp: 1737388800,
  age: "Seniors",
  date: "2025-01-15 15:00",
  time: "1970-01-01 15:00",
  homeClub: { id: 123, name: "KCVV Elewijt" },
  awayClub: { id: 456, name: "Opponent FC" },
  goalsHomeTeam: 3,
  goalsAwayTeam: 1,
  homeTeamId: 1,
  awayTeamId: 2,
  status: 0,
  competitionType: "3de Nationale",
  viewGameReport: true,
};

describe("transformFootbalistoMatch", () => {
  it("maps a finished match correctly", () => {
    const result = transformFootbalistoMatch(rawMatch);
    expect(result.id).toBe(42);
    expect(result.status).toBe("finished");
    expect(result.home_team.name).toBe("KCVV Elewijt");
    expect(result.home_team.score).toBe(3);
    expect(result.away_team.score).toBe(1);
    expect(result.time).toBe("15:00");
  });

  it("uses 'A-ploeg' round label for teamId 1", () => {
    const result = transformFootbalistoMatch(rawMatch);
    expect(result.round).toBe("A-ploeg");
  });

  it("uses 'B-ploeg' round label for teamId 2", () => {
    const result = transformFootbalistoMatch({ ...rawMatch, teamId: 2 });
    expect(result.round).toBe("B-ploeg");
  });

  it("uses age string as round label for other team IDs", () => {
    const result = transformFootbalistoMatch({
      ...rawMatch,
      teamId: 5,
      age: "U17",
    });
    expect(result.round).toBe("U17");
  });

  it("maps scheduled (0) with null scores", () => {
    const result = transformFootbalistoMatch({
      ...rawMatch,
      status: 0,
      goalsHomeTeam: null,
      goalsAwayTeam: null,
    });
    expect(result.status).toBe("scheduled");
    expect(result.home_team.score).toBeUndefined();
  });

  it("maps forfeited (1), postponed (2), stopped (3)", () => {
    expect(transformFootbalistoMatch({ ...rawMatch, status: 1 }).status).toBe(
      "forfeited",
    );
    expect(transformFootbalistoMatch({ ...rawMatch, status: 2 }).status).toBe(
      "postponed",
    );
    expect(transformFootbalistoMatch({ ...rawMatch, status: 3 }).status).toBe(
      "stopped",
    );
  });

  it("maps cancelled=true to postponed regardless of status", () => {
    expect(
      transformFootbalistoMatch({ ...rawMatch, status: 0, cancelled: true })
        .status,
    ).toBe("postponed");
    expect(
      transformFootbalistoMatch({ ...rawMatch, status: 1, cancelled: true })
        .status,
    ).toBe("postponed");
  });
});

describe("transformFootbalistoRankingEntry", () => {
  const rawEntry: FootbalistoRankingEntry = {
    id: 1,
    rank: 3,
    matchesPlayed: 20,
    wins: 12,
    draws: 4,
    losses: 4,
    goalsScored: 38,
    goalsConceded: 22,
    points: 40,
    team: {
      id: 101,
      club: { id: 123, localName: "KCVV Elewijt", name: "KCVV Elewijt" },
    },
  };

  it("maps all ranking fields", () => {
    const result = transformFootbalistoRankingEntry(
      rawEntry,
      "https://cdn.example.com",
    );
    expect(result.position).toBe(3);
    expect(result.team_id).toBe(101);
    expect(result.team_name).toBe("KCVV Elewijt");
    expect(result.team_logo).toBe(
      "https://cdn.example.com/extra_groot/123.png",
    );
    expect(result.goal_difference).toBe(16);
    expect(result.points).toBe(40);
  });

  it("falls back to club name when localName is null", () => {
    const entry = {
      ...rawEntry,
      team: {
        ...rawEntry.team,
        club: { ...rawEntry.team.club, localName: null },
      },
    };
    const result = transformFootbalistoRankingEntry(
      entry,
      "https://cdn.example.com",
    );
    expect(result.team_name).toBe("KCVV Elewijt");
  });
});

describe("transformFootbalistoMatchDetail", () => {
  const rawDetail: FootbalistoMatchDetailResponse = {
    general: {
      id: 99,
      date: "2025-03-01 14:30",
      homeClub: { id: 123, name: "KCVV Elewijt" },
      awayClub: { id: 456, name: "Opponent FC" },
      goalsHomeTeam: 2,
      goalsAwayTeam: 0,
      competitionType: "3de Nationale",
      viewGameReport: true,
      status: 0,
    },
  };

  it("maps match detail without lineup", () => {
    const result = transformFootbalistoMatchDetail(rawDetail);
    expect(result.id).toBe(99);
    expect(result.status).toBe("finished");
    expect(result.hasReport).toBe(true);
    expect(result.lineup).toBeUndefined();
  });

  it("maps lineup players when present", () => {
    const result = transformFootbalistoMatchDetail({
      ...rawDetail,
      lineup: {
        home: [{ playerName: "Jan Janssen", status: "basis", changed: false }],
        away: [{ playerName: "Piet Pieters", status: "basis", changed: false }],
      },
    });
    expect(result.lineup?.home[0]?.name).toBe("Jan Janssen");
    expect(result.lineup?.home[0]?.status).toBe("starter");
  });

  it("marks 'basis + changed' player as substituted", () => {
    const result = transformFootbalistoMatchDetail({
      ...rawDetail,
      lineup: {
        home: [{ playerName: "Jan Janssen", status: "basis", changed: true }],
        away: [],
      },
    });
    expect(result.lineup?.home[0]?.status).toBe("substituted");
  });

  it("adds yellow card from events", () => {
    const result = transformFootbalistoMatchDetail({
      ...rawDetail,
      lineup: {
        home: [
          {
            playerName: "Jan Janssen",
            playerId: 7,
            status: "basis",
            changed: false,
          },
        ],
        away: [],
      },
      events: [{ action: { type: "CARD", subtype: "YELLOW" }, playerId: 7 }],
    });
    expect(result.lineup?.home[0]?.card).toBe("yellow");
  });
});
