/**
 * Match Detail Page Utils Tests
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  transformHomeTeam,
  transformAwayTeam,
  transformLineupPlayer,
  enrichLineupWithKeeperFlag,
  extractMatchTime,
  formatMatchTitle,
  formatMatchDescription,
  matchDetailToHeroRow,
} from "./utils";
import type { LineupPlayer } from "@/components/match/MatchLineup";
import type { MatchLineupPlayer } from "@/lib/effect/schemas/match.schema";
import { asRowKind } from "@/components/match/test-narrowing";
import { createMatchDetail } from "./match-detail.fixtures";

describe("transformHomeTeam", () => {
  it("transforms home team data", () => {
    const match = createMatchDetail({
      home_team: { id: 1, name: "KCVV Elewijt", logo: "/logo.png", score: 3 },
    });
    const result = transformHomeTeam(match);
    expect(result).toEqual({
      id: 1,
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
      id: 1,
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
      id: 2,
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
      id: 2,
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

/**
 * Kickoffs are spelled the way the BFF spells them — `Date.UTC(…)`, because
 * `parseDateString` builds a match date from PSD's Belgian local string without
 * converting, so its UTC fields *are* the wall clock. These fixtures previously
 * used `new Date("…T15:30:00")`, which Node reads as *local* time: a shape no
 * source emits, and the reason reading the date with `getHours()` looked
 * correct (#2601).
 */
describe("extractMatchTime", () => {
  const at = (hour: number, minute = 0) =>
    new Date(Date.UTC(2025, 11, 7, hour, minute));

  it("returns provided time if available", () => {
    const match = createMatchDetail({ time: "15:00" });
    expect(extractMatchTime(match)).toBe("15:00");
  });

  it("extracts time from date when time not provided", () => {
    const match = createMatchDetail({ date: at(15, 30), time: undefined });
    expect(extractMatchTime(match)).toBe("15:30");
  });

  it("returns undefined for midnight time (likely no time set)", () => {
    const match = createMatchDetail({ date: at(0, 0), time: undefined });
    expect(extractMatchTime(match)).toBeUndefined();
  });

  it("handles single digit hours and minutes", () => {
    const match = createMatchDetail({ date: at(9, 5), time: undefined });
    expect(extractMatchTime(match)).toBe("09:05");
  });

  it("returns undefined rather than 'NaN:NaN' for an unparseable date", () => {
    const match = createMatchDetail({ date: new Date(NaN), time: undefined });
    expect(extractMatchTime(match)).toBeUndefined();
  });

  describe("across runtime zones", () => {
    let savedTz: string | undefined;
    beforeEach(() => {
      savedTz = process.env.TZ;
    });
    afterEach(() => {
      if (savedTz !== undefined) process.env.TZ = savedTz;
      else delete process.env.TZ;
    });

    it.each(["UTC", "Europe/Brussels", "America/New_York"])(
      "reads the kickoff off the date's own wall clock under TZ=%s",
      (tz) => {
        process.env.TZ = tz;
        const match = createMatchDetail({ date: at(15, 30), time: undefined });
        expect(extractMatchTime(match)).toBe("15:30");
      },
    );

    it.each(["UTC", "Europe/Brussels", "America/New_York"])(
      "still reads a timeless fixture as no kickoff under TZ=%s",
      (tz) => {
        process.env.TZ = tz;
        const match = createMatchDetail({ date: at(0, 0), time: undefined });
        expect(extractMatchTime(match)).toBeUndefined();
      },
    );
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

  it("titles a pitch-reservation placeholder instead of 'KCVV Elewijt vs KCVV Elewijt' (#2606, #2688)", () => {
    const match = createMatchDetail({
      is_placeholder: true,
      home_team: { id: 1235, name: "KCVV Elewijt" },
      away_team: { id: 1235, name: "KCVV Elewijt" },
    });
    expect(formatMatchTitle(match)).toBe("Gereserveerd — KCVV Elewijt");
  });

  it("carries the competition subject into a reservation's title, not just the fallback word (#2688)", () => {
    const match = createMatchDetail({
      is_placeholder: true,
      home_team: { id: 1235, name: "KCVV Elewijt" },
      away_team: { id: 1235, name: "KCVV Elewijt" },
      competition: "Tornooi",
    });
    expect(formatMatchTitle(match)).toBe("Tornooi — KCVV Elewijt");
  });

  it("titles a tournament fixture with no result yet by subject and club, never a bare vs (#2696/#2802 review)", () => {
    const match = createMatchDetail({
      competitionType: "tournament",
      status: "scheduled",
      home_team: { id: 1235, name: "KCVV Elewijt" },
      away_team: { id: 99, name: "FC Zemst Sportief" },
      competition: "Tornooi",
    });
    expect(formatMatchTitle(match)).toBe(
      "Tornooi · FC Zemst Sportief — KCVV Elewijt",
    );
  });

  it("resolves the club suffix by id even when KCVV is listed away (#2802 review)", () => {
    const match = createMatchDetail({
      competitionType: "tournament",
      status: "scheduled",
      home_team: { id: 99, name: "FC Zemst Sportief" },
      away_team: { id: 1235, name: "KCVV Elewijt" },
      competition: "Tornooi",
    });
    expect(formatMatchTitle(match)).toBe(
      "Tornooi · FC Zemst Sportief — KCVV Elewijt",
    );
  });

  it("reverts to the ordinary scored title once a tournament fixture has a result (#2696 review)", () => {
    const match = createMatchDetail({
      competitionType: "tournament",
      status: "finished",
      home_team: { id: 1235, name: "KCVV Elewijt", score: 3 },
      away_team: { id: 99, name: "FC Zemst Sportief", score: 1 },
      competition: "Tornooi",
    });
    expect(formatMatchTitle(match)).toBe(
      "KCVV Elewijt 3 - 1 FC Zemst Sportief",
    );
  });
});

describe("matchDetailToHeroRow (#2802 review — the fourth adapter)", () => {
  it("builds the match branch for an ordinary two-team fixture", () => {
    const match = createMatchDetail({
      home_team: { id: 1235, name: "KCVV Elewijt" },
      away_team: { id: 2, name: "KFC Turnhout" },
    });
    const row = matchDetailToHeroRow(match);
    expect(row.kind).toBe("match");
    const matchRow = asRowKind(row, "match", "expected match kind");
    expect(matchRow.homeTeam.name).toBe("KCVV Elewijt");
    expect(matchRow.awayTeam.name).toBe("KFC Turnhout");
  });

  it("builds the reservation branch with the single reserving team, never a fabricated opponent", () => {
    const match = createMatchDetail({
      is_placeholder: true,
      home_team: { id: 1235, name: "KCVV Elewijt" },
      away_team: { id: 1235, name: "KCVV Elewijt" },
    });
    const row = matchDetailToHeroRow(match);
    expect(row.kind).toBe("reservation");
    const reservationRow = asRowKind(
      row,
      "reservation",
      "expected reservation kind",
    );
    expect(reservationRow.team.name).toBe("KCVV Elewijt");
  });

  it("builds the reduced branch resolving the other club by id, even when KCVV is listed away", () => {
    const match = createMatchDetail({
      competitionType: "tournament",
      status: "scheduled",
      home_team: { id: 99, name: "FC Zemst Sportief" },
      away_team: { id: 1235, name: "KCVV Elewijt" },
      competition: "Tornooi",
    });
    const row = matchDetailToHeroRow(match);
    expect(row.kind).toBe("reduced");
    const reducedRow = asRowKind(row, "reduced", "expected reduced kind");
    expect(reducedRow.team.name).toBe("FC Zemst Sportief");
  });

  it("reverts a tournament fixture to the match branch once a result exists", () => {
    const match = createMatchDetail({
      competitionType: "tournament",
      status: "finished",
      home_team: { id: 1235, name: "KCVV Elewijt", score: 3 },
      away_team: { id: 99, name: "FC Zemst Sportief", score: 1 },
      competition: "Tornooi",
    });
    const row = matchDetailToHeroRow(match);
    expect(row.kind).toBe("match");
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

describe("enrichLineupWithKeeperFlag", () => {
  const keeperIds: ReadonlySet<string> = new Set(["100", "200"]);
  function makePlayer(overrides: Partial<LineupPlayer> = {}): LineupPlayer {
    return {
      id: 100,
      name: "Ben Lievens",
      number: 11,
      isCaptain: false,
      status: "starter",
      ...overrides,
    };
  }

  it("flags KCVV-side players whose PSD id is in the Sanity keeper set", () => {
    const player = makePlayer({ id: 100, number: 11 });
    const enriched = enrichLineupWithKeeperFlag(
      player,
      "home",
      "home",
      keeperIds,
    );
    expect(enriched.isKeeper).toBe(true);
  });

  it("does NOT flag KCVV-side outfield players (id not in keeper set)", () => {
    const player = makePlayer({ id: 999, number: 1 });
    const enriched = enrichLineupWithKeeperFlag(
      player,
      "home",
      "home",
      keeperIds,
    );
    // Even though jersey=1, the Sanity lookup is authoritative on the KCVV side.
    expect(enriched.isKeeper).toBe(false);
  });

  it("falls back to jersey #1 = keeper for opponent-side players", () => {
    const keeper = makePlayer({ id: 999, number: 1 });
    const outfield = makePlayer({ id: 998, number: 7 });
    expect(
      enrichLineupWithKeeperFlag(keeper, "away", "home", keeperIds).isKeeper,
    ).toBe(true);
    expect(
      enrichLineupWithKeeperFlag(outfield, "away", "home", keeperIds).isKeeper,
    ).toBe(false);
  });

  it("falls back to jersey #1 on BOTH sides when kcvvSide is undefined", () => {
    const sanityKeeper = makePlayer({ id: 100, number: 7 });
    const numberOneOutfield = makePlayer({ id: 999, number: 1 });
    // kcvvSide=undefined → never trust the Sanity lookup, use #1 everywhere.
    expect(
      enrichLineupWithKeeperFlag(sanityKeeper, "home", undefined, keeperIds)
        .isKeeper,
    ).toBe(false);
    expect(
      enrichLineupWithKeeperFlag(
        numberOneOutfield,
        "home",
        undefined,
        keeperIds,
      ).isKeeper,
    ).toBe(true);
  });

  it("does not flag a KCVV-side player whose PSD id is undefined", () => {
    const player = makePlayer({ id: undefined, number: 1 });
    const enriched = enrichLineupWithKeeperFlag(
      player,
      "home",
      "home",
      keeperIds,
    );
    expect(enriched.isKeeper).toBe(false);
  });

  it("falls back to jersey #1 on BOTH sides when keeperPsdIds is undefined (Sanity outage)", () => {
    const kcvvKeeper = makePlayer({ id: 100, number: 1 });
    const kcvvOutfield = makePlayer({ id: 100, number: 7 });
    const opponentKeeper = makePlayer({ id: 999, number: 1 });
    // keeperPsdIds=undefined → never trust Sanity; jersey-#1 only.
    expect(
      enrichLineupWithKeeperFlag(kcvvKeeper, "home", "home", undefined)
        .isKeeper,
    ).toBe(true);
    expect(
      enrichLineupWithKeeperFlag(kcvvOutfield, "home", "home", undefined)
        .isKeeper,
    ).toBe(false);
    expect(
      enrichLineupWithKeeperFlag(opponentKeeper, "away", "home", undefined)
        .isKeeper,
    ).toBe(true);
  });
});
