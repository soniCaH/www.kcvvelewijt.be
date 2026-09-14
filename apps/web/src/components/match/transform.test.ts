/**
 * Tests for the shared Match → ScheduleMatch adapter.
 */

import { describe, it, expect } from "vitest";
import { transformMatchToSchedule } from "./transform";
import type { ScheduleReservation, ScheduleReducedMatch } from "./types";
import { asNonPlaceholder, asReduced } from "./test-narrowing";
import { createMatch } from "./match.fixtures";

// Type-level assertion (#2802 review) — TypeScript, not vitest, is under
// test here. `@ts-expect-error` fails the type check if `ScheduleReservation`
// or `ScheduleReducedMatch` ever grow a `homeTeam` field, which is what makes
// "a renderer reaches for the two-team scoreboard on a reservation/reduced
// row" a compile error at the call site instead of `undefined.id` at runtime.
const _reservationHasNoHomeTeam: ScheduleReservation = {
  isPlaceholder: true,
  kind: "reservation",
  id: 1,
  date: new Date(),
  team: { id: 1235, name: "KCVV Elewijt" },
  status: "scheduled",
  // @ts-expect-error — a reservation has one `team`, never a `homeTeam`
  homeTeam: { id: 1235, name: "KCVV Elewijt" },
};
const _reducedHasNoHomeTeam: ScheduleReducedMatch = {
  isPlaceholder: false,
  kind: "reduced",
  id: 1,
  date: new Date(),
  team: { id: 99, name: "FC Zemst Sportief" },
  status: "scheduled",
  // @ts-expect-error — a reduced row has one `team`, never a `homeTeam`
  homeTeam: { id: 1235, name: "KCVV Elewijt" },
};

describe("transformMatchToSchedule", () => {
  it("transforms a match to schedule format", () => {
    const match = createMatch();
    const result = asNonPlaceholder(transformMatchToSchedule(match));

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

  it("carries the opponent team designation through as teamLabel", () => {
    const match = createMatch({
      away_team: { id: 2, name: "Opponent", team_label: "U23" },
    });
    expect(
      asNonPlaceholder(transformMatchToSchedule(match)).awayTeam.teamLabel,
    ).toBe("U23");
  });

  it("handles scheduled match without scores", () => {
    const match = createMatch({
      status: "scheduled",
      home_team: { id: 1, name: "KCVV", score: undefined },
      away_team: { id: 2, name: "Opponent", score: undefined },
    });
    const result = asNonPlaceholder(transformMatchToSchedule(match));

    expect(result.status).toBe("scheduled");
    expect(result.homeScore).toBeUndefined();
    expect(result.awayScore).toBeUndefined();
  });

  it("handles match without logos", () => {
    const match = createMatch({
      home_team: { id: 1, name: "KCVV", logo: undefined },
      away_team: { id: 2, name: "Opponent", logo: undefined },
    });
    const result = asNonPlaceholder(transformMatchToSchedule(match));

    expect(result.homeTeam.logo).toBeUndefined();
    expect(result.awayTeam.logo).toBeUndefined();
  });

  it("passes is_home through as isHome when present", () => {
    const homeMatch = createMatch({ is_home: true });
    expect(asNonPlaceholder(transformMatchToSchedule(homeMatch)).isHome).toBe(
      true,
    );

    const awayMatch = createMatch({ is_home: false });
    expect(asNonPlaceholder(transformMatchToSchedule(awayMatch)).isHome).toBe(
      false,
    );
  });

  it("leaves isHome undefined when is_home is absent", () => {
    const match = createMatch();
    expect(
      asNonPlaceholder(transformMatchToSchedule(match)).isHome,
    ).toBeUndefined();
  });

  it("passes competitionType through when present (#2696)", () => {
    const match = createMatch({ competitionType: "tournament" });
    expect(
      asNonPlaceholder(transformMatchToSchedule(match)).competitionType,
    ).toBe("tournament");
  });

  it("leaves competitionType undefined when absent", () => {
    const match = createMatch();
    expect(
      asNonPlaceholder(transformMatchToSchedule(match)).competitionType,
    ).toBeUndefined();
  });

  it("passes is_placeholder through as isPlaceholder when present (#2606)", () => {
    const placeholder = createMatch({ is_placeholder: true });
    expect(transformMatchToSchedule(placeholder).isPlaceholder).toBe(true);

    const normal = createMatch({ is_placeholder: false });
    expect(transformMatchToSchedule(normal).isPlaceholder).toBe(false);
  });

  it("normalizes isPlaceholder to false when is_placeholder is absent (#2688 — a definite discriminant, not a tri-state)", () => {
    const match = createMatch();
    expect(transformMatchToSchedule(match).isPlaceholder).toBe(false);
  });

  it("returns the ScheduleReservation shape for a placeholder — no awayTeam/scores, one `team` (#2688)", () => {
    const placeholder = createMatch({
      is_placeholder: true,
      home_team: {
        id: 1235,
        name: "KCVV Elewijt",
        logo: "https://example.com/kcvv.png",
      },
      away_team: { id: 1235, name: "KCVV Elewijt" },
      status: "scheduled",
      competition: "Tornooi",
    });
    const result = transformMatchToSchedule(placeholder);

    expect(result.isPlaceholder).toBe(true);
    if (!result.isPlaceholder) throw new Error("expected a reservation");
    expect(result.team).toEqual({
      id: 1235,
      name: "KCVV Elewijt",
      logo: "https://example.com/kcvv.png",
      teamLabel: undefined,
    });
    expect(result.competition).toBe("Tornooi");
    expect("awayTeam" in result).toBe(false);
    expect("homeScore" in result).toBe(false);
    expect("awayScore" in result).toBe(false);
    expect(result.kind).toBe("reservation");
  });

  it('emits kind: "match" for an ordinary fixture (#2802)', () => {
    expect(asNonPlaceholder(transformMatchToSchedule(createMatch())).kind).toBe(
      "match",
    );
  });

  describe("a tournament fixture with no result yet reverts to the full scoreboard once a score arrives (#2696/#2802)", () => {
    it("returns the ScheduleReducedMatch shape — one `team` (the other club), no awayTeam/scores", () => {
      const pending = createMatch({
        competitionType: "tournament",
        status: "scheduled",
        home_team: {
          id: 1235,
          name: "KCVV Elewijt",
          logo: "https://example.com/kcvv.png",
        },
        away_team: {
          id: 99,
          name: "FC Zemst Sportief",
          logo: "https://example.com/zemst.png",
        },
        competition: "Tornooi",
      });

      const result = asReduced(transformMatchToSchedule(pending));

      expect(result.team).toEqual({
        id: 99,
        name: "FC Zemst Sportief",
        logo: "https://example.com/zemst.png",
        teamLabel: undefined,
      });
      expect(result.competition).toBe("Tornooi");
      expect(result.competitionType).toBe("tournament");
      expect("awayTeam" in result).toBe(false);
      expect("homeScore" in result).toBe(false);
      expect("awayScore" in result).toBe(false);
    });

    it('reverts to kind: "match" the moment both scores are present, same fixture id', () => {
      const played = createMatch({
        id: 555,
        competitionType: "tournament",
        status: "finished",
        home_team: { id: 1235, name: "KCVV Elewijt", score: 3 },
        away_team: { id: 99, name: "FC Zemst Sportief", score: 1 },
        competition: "Tornooi",
      });

      const result = asNonPlaceholder(transformMatchToSchedule(played));

      expect(result.id).toBe(555);
      expect(result.homeScore).toBe(3);
      expect(result.awayScore).toBe(1);
      expect(result.awayTeam.name).toBe("FC Zemst Sportief");
    });

    it("stays reduced for a played tournament fixture whose scores are missing from the feed", () => {
      const played = createMatch({
        competitionType: "tournament",
        status: "finished",
        home_team: { id: 1235, name: "KCVV Elewijt" },
        away_team: { id: 99, name: "FC Zemst Sportief" },
      });

      expect(transformMatchToSchedule(played).kind).toBe("reduced");
    });

    it("never applies to an ordinary league fixture, even before kickoff", () => {
      const scheduled = createMatch({
        competitionType: "league",
        status: "scheduled",
        home_team: { id: 1235, name: "KCVV Elewijt", score: undefined },
        away_team: { id: 99, name: "FC Zemst Sportief", score: undefined },
      });

      expect(transformMatchToSchedule(scheduled).kind).toBe("match");
    });

    it("resolves the other club by id, not by home/away side (#2696)", () => {
      // KCVV listed as away this time — the crest must still name the other
      // club, proving the derivation reads the club id, never the side PSD
      // happened to list it on.
      const pending = createMatch({
        competitionType: "tournament",
        status: "scheduled",
        home_team: {
          id: 99,
          name: "FC Zemst Sportief",
          logo: "https://example.com/zemst.png",
        },
        away_team: { id: 1235, name: "KCVV Elewijt" },
        competition: "Tornooi",
      });

      const result = asReduced(transformMatchToSchedule(pending));

      expect(result.team).toEqual({
        id: 99,
        name: "FC Zemst Sportief",
        logo: "https://example.com/zemst.png",
        teamLabel: undefined,
      });
    });
  });
});
