/**
 * Calendar Utils Tests
 */

import { describe, it, expect } from "vitest";
import {
  transformMatchToCalendar,
  getMatchesForDay,
  getEventsForDay,
  getDaysInMonth,
  getDaysInWeek,
  getMatchDotType,
} from "./utils";
import type { Match } from "@/lib/effect/schemas/match.schema";
import type { CalendarMatch, CalendarEvent } from "./utils";

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
      kcvvTeamId: undefined,
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

// ── Fixtures for new helpers ──────────────────────────────────────────────

function makeCalendarMatch(
  overrides: Partial<CalendarMatch> & { id: number },
): CalendarMatch {
  return {
    date: "2026-03-15T15:00:00",
    homeTeam: { id: 1, name: "KCVV Elewijt A", logo: "/kcvv.png" },
    awayTeam: { id: 2, name: "Racing Mechelen" },
    status: "scheduled",
    team: "A-ploeg",
    scoreDisplay: { type: "vs" },
    ...overrides,
  };
}

function makeCalendarEvent(
  overrides: Partial<CalendarEvent> & { id: string },
): CalendarEvent {
  return {
    title: "Paastoernooi",
    dateStart: "2026-03-15T10:00:00",
    href: "/events/paastoernooi",
    ...overrides,
  };
}

// ── getMatchesForDay ──────────────────────────────────────────────────────

describe("getMatchesForDay", () => {
  it("returns matches whose ISO date matches the given day", () => {
    const matches = [
      makeCalendarMatch({ id: 1, date: "2026-03-15T15:00:00" }),
      makeCalendarMatch({ id: 2, date: "2026-03-16T10:00:00" }),
      makeCalendarMatch({ id: 3, date: "2026-03-15T18:00:00" }),
    ];
    const result = getMatchesForDay(matches, "2026-03-15");
    expect(result.map((m) => m.id)).toEqual([1, 3]);
  });

  it("returns empty array when no matches on day", () => {
    const matches = [makeCalendarMatch({ id: 1, date: "2026-03-16T10:00:00" })];
    expect(getMatchesForDay(matches, "2026-03-15")).toEqual([]);
  });
});

// ── getEventsForDay ───────────────────────────────────────────────────────

describe("getEventsForDay", () => {
  it("returns events whose dateStart matches the given day", () => {
    const events = [
      makeCalendarEvent({ id: "e1", dateStart: "2026-03-15T10:00:00" }),
      makeCalendarEvent({ id: "e2", dateStart: "2026-03-16T10:00:00" }),
    ];
    const result = getEventsForDay(events, "2026-03-15");
    expect(result.map((e) => e.id)).toEqual(["e1"]);
  });

  it("returns empty array when no events on day", () => {
    const events = [
      makeCalendarEvent({ id: "e1", dateStart: "2026-03-16T10:00:00" }),
    ];
    expect(getEventsForDay(events, "2026-03-15")).toEqual([]);
  });
});

// ── getDaysInMonth ────────────────────────────────────────────────────────

describe("getDaysInMonth", () => {
  it("returns 42 days (6 rows) for March 2026", () => {
    const days = getDaysInMonth(2026, 3); // March
    expect(days).toHaveLength(42);
  });

  it("starts on Monday and ends on Sunday", () => {
    const days = getDaysInMonth(2026, 3);
    // March 2026 starts on Sunday → grid starts previous Monday (Feb 23)
    expect(days[0]).toBe("2026-02-23");
    // Last day is Sunday April 5
    expect(days[41]).toBe("2026-04-05");
  });

  it("returns 35 days when month fits 5 rows", () => {
    // February 2026 starts on Sunday → needs 6 rows actually
    // June 2026 starts on Monday → fits in 5 rows
    const days = getDaysInMonth(2026, 6);
    expect(days).toHaveLength(35);
  });
});

// ── getDaysInWeek ─────────────────────────────────────────────────────────

describe("getDaysInWeek", () => {
  it("returns 7 days starting from Monday", () => {
    const days = getDaysInWeek("2026-03-25"); // Wednesday
    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2026-03-23"); // Monday
    expect(days[6]).toBe("2026-03-29"); // Sunday
  });

  it("handles week starting on Monday", () => {
    const days = getDaysInWeek("2026-03-23"); // Monday
    expect(days[0]).toBe("2026-03-23");
    expect(days[6]).toBe("2026-03-29");
  });

  it("handles week ending on Sunday", () => {
    const days = getDaysInWeek("2026-03-29"); // Sunday
    expect(days[0]).toBe("2026-03-23");
    expect(days[6]).toBe("2026-03-29");
  });
});

// ── getMatchDotType ───────────────────────────────────────────────────────

describe("getMatchDotType", () => {
  it("returns 'home' when kcvvTeamId matches homeTeam.id", () => {
    const match = makeCalendarMatch({
      id: 1,
      kcvvTeamId: 1,
      homeTeam: { id: 1, name: "KCVV Elewijt A" },
      awayTeam: { id: 2, name: "Racing Mechelen" },
    });
    expect(getMatchDotType(match)).toBe("home");
  });

  it("returns 'away' when kcvvTeamId matches awayTeam.id", () => {
    const match = makeCalendarMatch({
      id: 1,
      kcvvTeamId: 1,
      homeTeam: { id: 2, name: "Racing Mechelen" },
      awayTeam: { id: 1, name: "KCVV Elewijt A" },
    });
    expect(getMatchDotType(match)).toBe("away");
  });

  it("falls back to name matching when kcvvTeamId is absent", () => {
    const match = makeCalendarMatch({
      id: 1,
      homeTeam: { id: 1, name: "KCVV Elewijt A" },
      awayTeam: { id: 2, name: "Racing Mechelen" },
    });
    expect(getMatchDotType(match)).toBe("home");
  });
});
