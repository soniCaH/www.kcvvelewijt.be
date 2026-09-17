/**
 * Match Mapper Tests
 */

import { describe, it, expect } from "vitest";
import {
  mapMatchToUpcomingMatch,
  mapMatchesToUpcomingMatches,
} from "./match.mapper";
import type { Match } from "@/lib/effect/schemas/match.schema";
import type {
  UpcomingReservation,
  UpcomingReducedMatch,
} from "@/components/match/types";
import {
  asNonPlaceholder,
  asReduced,
  asRowKind,
} from "@/components/match/test-narrowing";
import { createRawMatch } from "@/components/match/match.fixtures";

// Type-level assertion (#2802 review) — TypeScript, not vitest, is under
// test here. `@ts-expect-error` fails the type check if `UpcomingReservation`
// or `UpcomingReducedMatch` ever grow a `homeTeam` field, which is what makes
// a renderer reaching for the two-team scoreboard on a reservation/reduced
// row a compile error instead of a runtime crash.
const _reservationHasNoHomeTeam: UpcomingReservation = {
  kind: "reservation",
  id: 1,
  date: new Date(),
  team: { id: 1235, name: "KCVV Elewijt" },
  status: "scheduled",
  // @ts-expect-error — a reservation has one `team`, never a `homeTeam`
  homeTeam: { id: 1235, name: "KCVV Elewijt" },
};
const _reducedHasNoHomeTeam: UpcomingReducedMatch = {
  kind: "reduced",
  id: 1,
  date: new Date(),
  team: { id: 99, name: "FC Zemst Sportief" },
  status: "scheduled",
  // @ts-expect-error — a reduced row has one `team`, never a `homeTeam`
  homeTeam: { id: 1235, name: "KCVV Elewijt" },
};

describe("mapMatchToUpcomingMatch", () => {
  it("should map a scheduled match correctly", () => {
    const match = createRawMatch({
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
        name: "KCVV Elewijt",
        logo: "https://example.com/logo2.png",
      },
      status: "scheduled",
      squadLabel: "U9",
      competition: "Competitie",
    });

    const result = mapMatchToUpcomingMatch(match);

    expect(result).toEqual({
      kind: "match",
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
        name: "KCVV Elewijt",
        logo: "https://example.com/logo2.png",
        score: undefined,
      },
      status: "scheduled",
      squadLabel: "U9",
      kcvvTeamId: undefined,
      kcvvTeamLabel: undefined,
      competition: "Competitie",
    });
  });

  it("should map a forfeited match with scores correctly", () => {
    const match = createRawMatch({
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
      squadLabel: "U15",
      competition: "Competitie",
    });

    const result = asNonPlaceholder(mapMatchToUpcomingMatch(match));

    expect(result.homeTeam.score).toBe(2);
    expect(result.awayTeam.score).toBe(1);
    expect(result.status).toBe("forfeited");
  });

  it("should handle postponed status", () => {
    const match = createRawMatch({
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
      squadLabel: "U13",
      competition: "Competitie",
    });

    const result = mapMatchToUpcomingMatch(match);

    expect(result.status).toBe("postponed");
  });

  it("should map kcvv_team_id and kcvv_team_label", () => {
    const match = createRawMatch({
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
    });

    const result = asNonPlaceholder(mapMatchToUpcomingMatch(match));

    expect(result.kcvvTeamId).toBe(7);
    expect(result.kcvvTeamLabel).toBe("U21");
  });

  it("returns an UpcomingReservation for a pitch-reservation placeholder — no awayTeam, one `team` (#2606, #2688)", () => {
    const match = createRawMatch({
      id: 90,
      date: new Date("2026-05-09T09:30:00"),
      time: "09:30",
      venue: undefined,
      home_team: {
        id: 1235,
        name: "KCVV Elewijt",
        logo: "https://example.com/kcvv.png",
      },
      away_team: { id: 1235, name: "KCVV Elewijt" },
      status: "scheduled",
      competition: "Tornooi",
      squadLabel: "U13",
      kcvv_team_id: 7,
      kcvv_team_label: "U13",
      is_placeholder: true,
    });

    const result = mapMatchToUpcomingMatch(match);

    expect(result.kind).toBe("reservation");
    const reservation = asRowKind(
      result,
      "reservation",
      "expected a reservation",
    );
    expect(reservation.team).toEqual({
      id: 1235,
      name: "KCVV Elewijt",
      logo: "https://example.com/kcvv.png",
    });
    expect(result.competition).toBe("Tornooi");
    expect(result.kcvvTeamLabel).toBe("U13");
    expect("awayTeam" in result).toBe(false);
    expect("homeScore" in result).toBe(false);
    expect("awayScore" in result).toBe(false);
    expect(result.kind).toBe("reservation");
  });

  describe("a tournament fixture with no result yet (#2696/#2802)", () => {
    it('returns the UpcomingReducedMatch shape and reverts to kind: "match" once scored', () => {
      const pending = createRawMatch({
        id: 91,
        date: new Date("2026-05-10T09:30:00.000Z"),
        time: "09:30",
        venue: undefined,
        home_team: { id: 1235, name: "KCVV Elewijt", logo: "kcvv.png" },
        away_team: { id: 77, name: "FC Zemst Sportief", logo: "zemst.png" },
        status: "scheduled",
        competition: "Tornooi",
        squadLabel: "U13",
        kcvv_team_id: 7,
        kcvv_team_label: "U13",
        competitionType: "tournament",
      });

      const reduced = asReduced(mapMatchToUpcomingMatch(pending));
      expect(reduced.team).toEqual({
        id: 77,
        name: "FC Zemst Sportief",
        logo: "zemst.png",
      });
      expect(reduced.kcvvTeamLabel).toBe("U13");
      expect("awayTeam" in reduced).toBe(false);
      expect("homeScore" in reduced).toBe(false);

      const played = createRawMatch({
        ...pending,
        status: "finished",
        home_team: {
          id: 1235,
          name: "KCVV Elewijt",
          logo: "kcvv.png",
          score: 2,
        },
        away_team: {
          id: 77,
          name: "FC Zemst Sportief",
          logo: "zemst.png",
          score: 0,
        },
      });
      const full = asNonPlaceholder(mapMatchToUpcomingMatch(played));
      expect(full.homeTeam.score).toBe(2);
      expect(full.awayTeam.score).toBe(0);
    });

    it("resolves the other club by id, not by home/away side (#2802 review)", () => {
      // KCVV listed as away this time — the crest must still name the
      // other club. `mapMatchToUpcomingMatch` is one of three hand-copied
      // `otherClubSide()` call sites; only asserting the KCVV-home
      // direction here would leave this one uncovered if it ever drifted
      // to reading `away_team` unconditionally.
      const pending = createRawMatch({
        id: 92,
        date: new Date("2026-05-10T09:30:00.000Z"),
        time: "09:30",
        venue: undefined,
        home_team: { id: 77, name: "FC Zemst Sportief", logo: "zemst.png" },
        away_team: { id: 1235, name: "KCVV Elewijt", logo: "kcvv.png" },
        status: "scheduled",
        competition: "Tornooi",
        competitionType: "tournament",
      });

      const reduced = asReduced(mapMatchToUpcomingMatch(pending));
      expect(reduced.team).toEqual({
        id: 77,
        name: "FC Zemst Sportief",
        logo: "zemst.png",
      });
    });
  });

  it("should handle stopped status", () => {
    const match = createRawMatch({
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
        name: "KCVV Elewijt",
        logo: "https://example.com/logo2.png",
      },
      status: "stopped",
      squadLabel: "U12",
      competition: "Competitie",
    });

    const result = asNonPlaceholder(mapMatchToUpcomingMatch(match));

    expect(result.status).toBe("stopped");
    expect(result.awayTeam.name).toBe("KCVV Elewijt");
  });
});

describe("mapMatchesToUpcomingMatches", () => {
  it("should map an array of matches correctly", () => {
    const matches: Match[] = [
      createRawMatch({
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
          name: "KCVV Elewijt",
          logo: "https://example.com/logo2.png",
        },
        status: "scheduled",
        squadLabel: "U9",
        competition: "Competitie",
      }),
      createRawMatch({
        id: 2,
        date: new Date("2025-12-07T15:00:00"),
        time: "15:00",
        venue: undefined,
        home_team: {
          id: 1235,
          name: "KCVV Elewijt",
          logo: "https://example.com/logo.png",
        },
        away_team: {
          id: 59,
          name: "KFC Turnhout",
          logo: "https://example.com/logo2.png",
        },
        status: "scheduled",
        squadLabel: "A-ploeg",
        competition: "Competitie",
      }),
    ];

    const result = mapMatchesToUpcomingMatches(matches);

    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe(1);
    expect(asNonPlaceholder(result[0]!).awayTeam.name).toBe("KCVV Elewijt");
    expect(result[1]!.id).toBe(2);
    expect(asNonPlaceholder(result[1]!).homeTeam.name).toBe("KCVV Elewijt");
  });

  it("should handle empty array", () => {
    const result = mapMatchesToUpcomingMatches([]);
    expect(result).toEqual([]);
  });
});
