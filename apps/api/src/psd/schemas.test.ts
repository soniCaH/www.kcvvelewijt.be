import { describe, it, expect } from "vitest";
import { Schema as S } from "effect";
import {
  FootbalistoMatchDetailResponse,
  FootbalistoRankingArray,
  FootbalistoRankingEntry,
} from "./schemas";

describe("FootbalistoMatchDetailResponse", () => {
  it("decodes a response without lineup", () => {
    const raw = {
      general: {
        id: 1,
        date: "2025-01-15 15:00",
        homeClub: { id: 123, name: "KCVV Elewijt" },
        awayClub: { id: 456, name: "Opponent FC" },
        goalsHomeTeam: 3,
        goalsAwayTeam: 1,
        competitionType: { id: 1, name: "3de Nationale", type: "LEAGUE" },
        viewGameReport: true,
        status: 1,
      },
    };
    const result = S.decodeUnknownSync(FootbalistoMatchDetailResponse)(raw);
    expect(result.general.id).toBe(1);
    expect(result.lineup).toBeUndefined();
  });
});

describe("FootbalistoRankingArray", () => {
  it("decodes a ranking response", () => {
    const raw = [
      {
        name: "3de Nationale A",
        type: "LEAGUE",
        teams: [
          {
            id: 1,
            rank: 1,
            matchesPlayed: 20,
            wins: 15,
            draws: 3,
            losses: 2,
            goalsScored: 45,
            goalsConceded: 20,
            points: 48,
            team: {
              id: 101,
              club: {
                id: 123,
                localName: "KCVV Elewijt",
                name: "KCVV Elewijt",
              },
            },
          },
        ],
      },
    ];
    const result = S.decodeUnknownSync(FootbalistoRankingArray)(raw);
    expect(result[0]?.teams).toHaveLength(1);
    // teams are unknown items — decode individually to verify shape
    const entry = S.decodeUnknownSync(FootbalistoRankingEntry)(
      result[0]?.teams[0],
    );
    expect(entry.rank).toBe(1);
  });
});
