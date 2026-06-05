/**
 * Calendar Utils Tests
 */

import { describe, it, expect } from "vitest";
import {
  transformMatchToCalendar,
  eventListItemToCalendarEvent,
  buildCalendarFeed,
  getDaysInMonth,
  getDaysInWeek,
  getMatchDotType,
  calendarMatchToScheduleMatch,
  buildMonthAgenda,
  groupFeedByDay,
  buildKalenderItemListEntries,
} from "./utils";
import type { Match } from "@/lib/effect/schemas/match.schema";
import type { EventListItemVM } from "@/lib/repositories/event.repository";
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
      isHome: undefined,
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

  it("passes through is_home as isHome", () => {
    const home = createMatch({ is_home: true } as Partial<Match>);
    expect(transformMatchToCalendar(home).isHome).toBe(true);

    const away = createMatch({ is_home: false } as Partial<Match>);
    expect(transformMatchToCalendar(away).isHome).toBe(false);
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

// ── eventListItemToCalendarEvent ──────────────────────────────────────────

function makeEventListItem(
  overrides: Partial<EventListItemVM> = {},
): EventListItemVM {
  return {
    id: "event-1",
    title: "Spaghetti-avond",
    href: "/evenementen/spaghetti-avond",
    dateStart: "2026-04-15T18:00:00Z",
    dateEnd: "2026-04-15T22:00:00Z",
    eventType: "Clubevent",
    location: "Sportpark Driesput, Elewijt",
    source: "event",
    ...overrides,
  };
}

describe("eventListItemToCalendarEvent", () => {
  it("maps an event-doc row to a calendar event keeping its /evenementen/[slug] href", () => {
    const result = eventListItemToCalendarEvent(makeEventListItem());

    expect(result).toEqual({
      id: "event-1",
      title: "Spaghetti-avond",
      dateStart: "2026-04-15T18:00:00Z",
      dateEnd: "2026-04-15T22:00:00Z",
      href: "/evenementen/spaghetti-avond",
      eventType: "Clubevent",
      source: "event",
    });
  });

  it("carries the feed source through (article)", () => {
    const result = eventListItemToCalendarEvent(
      makeEventListItem({ source: "article", href: "/nieuws/jeugdtornooi" }),
    );
    expect(result.source).toBe("article");
  });

  it("falls back to 'Andere' when the source row has no eventType", () => {
    const result = eventListItemToCalendarEvent(
      makeEventListItem({ eventType: null }),
    );
    expect(result.eventType).toBe("Andere");
  });

  it("maps a source:article row through with its /nieuws/[slug] href intact", () => {
    const result = eventListItemToCalendarEvent(
      makeEventListItem({
        id: "article-1",
        title: "Jeugdtornooi groot succes",
        href: "/nieuws/jeugdtornooi-verslag",
        source: "article",
        dateEnd: null,
      }),
    );

    expect(result.href).toBe("/nieuws/jeugdtornooi-verslag");
    expect(result.id).toBe("article-1");
  });

  it("normalises a null dateEnd to undefined (CalendarEvent has no nullable end)", () => {
    const result = eventListItemToCalendarEvent(
      makeEventListItem({ dateEnd: null }),
    );

    expect(result.dateEnd).toBeUndefined();
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
    href: "/evenementen/paastoernooi",
    eventType: "Clubevent",
    source: "event",
    ...overrides,
  };
}

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
  it("returns 'home' when isHome is true", () => {
    const match = makeCalendarMatch({
      id: 1,
      isHome: true,
      // Club IDs differ from team IDs in PSD — isHome is the authority
      homeTeam: { id: 1235, name: "KCVV Elewijt A" },
      awayTeam: { id: 999, name: "Racing Mechelen" },
    });
    expect(getMatchDotType(match)).toBe("home");
  });

  it("returns 'away' when isHome is false", () => {
    const match = makeCalendarMatch({
      id: 1,
      isHome: false,
      homeTeam: { id: 999, name: "Racing Mechelen" },
      awayTeam: { id: 1235, name: "KCVV Elewijt A" },
    });
    expect(getMatchDotType(match)).toBe("away");
  });

  it("returns 'home' when isHome is true even with non-KCVV home team name", () => {
    // Regression: isHome from BFF is the source of truth, not team names
    const match = makeCalendarMatch({
      id: 1,
      isHome: true,
      homeTeam: { id: 42, name: "Some Club" },
      awayTeam: { id: 99, name: "Other Club" },
    });
    expect(getMatchDotType(match)).toBe("home");
  });

  it("falls back to name matching when isHome is absent", () => {
    const match = makeCalendarMatch({
      id: 1,
      homeTeam: { id: 1, name: "KCVV Elewijt A" },
      awayTeam: { id: 2, name: "Racing Mechelen" },
    });
    expect(getMatchDotType(match)).toBe("home");
  });

  it("falls back to away when isHome is absent and name does not match", () => {
    const match = makeCalendarMatch({
      id: 1,
      homeTeam: { id: 1, name: "Racing Mechelen" },
      awayTeam: { id: 2, name: "KCVV Elewijt A" },
    });
    expect(getMatchDotType(match)).toBe("away");
  });
});

// ── buildCalendarFeed ─────────────────────────────────────────────────────

describe("buildCalendarFeed", () => {
  it("merges matches and events into one feed sorted chronologically by dateStart", () => {
    const feed = buildCalendarFeed(
      [
        makeCalendarMatch({ id: 1, date: "2026-09-20T15:00:00Z" }),
        makeCalendarMatch({ id: 2, date: "2026-09-12T18:00:00Z" }),
      ],
      [
        makeEventListItem({ id: "e-late", dateStart: "2026-09-25T18:00:00Z" }),
        makeEventListItem({
          id: "a-early",
          dateStart: "2026-09-14T10:00:00Z",
          source: "article",
          href: "/nieuws/a-early",
        }),
      ],
    );

    // 09-12 match · 09-14 article · 09-20 match · 09-25 event
    expect(feed.map((item) => item.id)).toEqual([
      "match-2",
      "a-early",
      "match-1",
      "e-late",
    ]);
  });

  it("tags matches as 'Wedstrijden' and events/articles with their eventType (null → 'Andere')", () => {
    const feed = buildCalendarFeed(
      [makeCalendarMatch({ id: 1, date: "2026-09-10T15:00:00Z" })],
      [
        makeEventListItem({
          id: "clubevent",
          dateStart: "2026-09-11T10:00:00Z",
          eventType: "Clubevent",
        }),
        makeEventListItem({
          id: "untyped",
          dateStart: "2026-09-12T10:00:00Z",
          eventType: null,
        }),
      ],
    );

    const typeById = Object.fromEntries(
      feed.map((item) => [item.id, item.kalenderType]),
    );
    expect(typeById["match-1"]).toBe("Wedstrijden");
    expect(typeById["clubevent"]).toBe("Clubevent");
    expect(typeById["untyped"]).toBe("Andere");
  });

  it("discriminates by source — match items carry the CalendarMatch, event/article items the CalendarEvent with its resolved href", () => {
    const [matchItem, eventItem, articleItem] = buildCalendarFeed(
      [makeCalendarMatch({ id: 7, date: "2026-09-10T15:00:00Z" })],
      [
        makeEventListItem({
          id: "evt",
          dateStart: "2026-09-11T10:00:00Z",
          source: "event",
          href: "/evenementen/spaghetti-avond",
        }),
        makeEventListItem({
          id: "art",
          dateStart: "2026-09-12T10:00:00Z",
          source: "article",
          href: "/nieuws/jeugdtornooi",
        }),
      ],
    );

    // match item — id is source-prefixed so it can't collide with a Sanity _id.
    expect(matchItem?.source).toBe("match");
    if (matchItem?.source === "match") {
      expect(matchItem.id).toBe("match-7");
      expect(matchItem.match.id).toBe(7);
    }

    // event-doc item links to /evenementen/[slug].
    expect(eventItem?.source).toBe("event");
    if (eventItem && eventItem.source !== "match") {
      expect(eventItem.event.href).toBe("/evenementen/spaghetti-avond");
    }

    // article item links to /nieuws/[slug].
    expect(articleItem?.source).toBe("article");
    if (articleItem && articleItem.source !== "match") {
      expect(articleItem.event.href).toBe("/nieuws/jeugdtornooi");
    }
  });
});

// ── calendarMatchToScheduleMatch ──────────────────────────────────────────

describe("calendarMatchToScheduleMatch", () => {
  it("maps the VM onto the ScheduleMatch shape (date string → Date)", () => {
    const result = calendarMatchToScheduleMatch(
      makeCalendarMatch({
        id: 7,
        date: "2026-09-12T10:00:00.000Z",
        time: "10:00",
        homeScore: 3,
        awayScore: 1,
        status: "finished",
        competition: "Tornooi",
      }),
    );

    expect(result.id).toBe(7);
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString()).toBe("2026-09-12T10:00:00.000Z");
    expect(result.time).toBe("10:00");
    expect(result.homeScore).toBe(3);
    expect(result.awayScore).toBe(1);
    expect(result.status).toBe("finished");
    expect(result.competition).toBe("Tornooi");
  });

  it("injects the KCVV squad label on the home side for a home match", () => {
    const result = calendarMatchToScheduleMatch(
      makeCalendarMatch({ id: 1, team: "U13", isHome: true }),
    );
    expect(result.homeTeam.teamLabel).toBe("U13");
    expect(result.awayTeam.teamLabel).toBeUndefined();
    expect(result.isHome).toBe(true);
  });

  it("injects the KCVV squad label on the away side for an away match", () => {
    const result = calendarMatchToScheduleMatch(
      makeCalendarMatch({ id: 2, team: "U13", isHome: false }),
    );
    expect(result.awayTeam.teamLabel).toBe("U13");
    expect(result.homeTeam.teamLabel).toBeUndefined();
    expect(result.isHome).toBe(false);
  });

  it("falls back to name-based home/away when isHome is absent", () => {
    const result = calendarMatchToScheduleMatch(
      makeCalendarMatch({
        id: 3,
        isHome: undefined,
        homeTeam: { id: 1, name: "KCVV Elewijt" },
        awayTeam: { id: 2, name: "Zemst" },
        team: "A-ploeg",
      }),
    );
    // name contains "kcvv" → treated as home.
    expect(result.isHome).toBe(true);
    expect(result.homeTeam.teamLabel).toBe("A-ploeg");
  });
});

// ── buildMonthAgenda ──────────────────────────────────────────────────────

describe("buildMonthAgenda", () => {
  it("groups items by day, only days with items, in chronological order", () => {
    const matches = [
      makeCalendarMatch({ id: 1, date: "2026-09-12T10:00:00.000Z" }),
      makeCalendarMatch({ id: 2, date: "2026-09-12T11:00:00.000Z" }),
      makeCalendarMatch({ id: 3, date: "2026-09-13T15:00:00.000Z" }),
    ];
    const events = [
      makeCalendarEvent({ id: "e1", dateStart: "2026-09-12T18:00:00.000Z" }),
    ];

    const groups = buildMonthAgenda(matches, events, 2026, 9);

    expect(groups.map((g) => g.date)).toEqual(["2026-09-12", "2026-09-13"]);
    expect(groups[0]!.matches).toHaveLength(2);
    expect(groups[0]!.events).toHaveLength(1);
    expect(groups[1]!.matches).toHaveLength(1);
    expect(groups[1]!.events).toHaveLength(0);
  });

  it("windows to the given month — items in other months are excluded", () => {
    const matches = [
      makeCalendarMatch({ id: 1, date: "2026-09-30T10:00:00.000Z" }),
      makeCalendarMatch({ id: 2, date: "2026-10-01T10:00:00.000Z" }),
      makeCalendarMatch({ id: 3, date: "2026-08-31T10:00:00.000Z" }),
    ];

    const groups = buildMonthAgenda(matches, [], 2026, 9);

    expect(groups.map((g) => g.date)).toEqual(["2026-09-30"]);
  });

  it("sorts matches within a day by kickoff", () => {
    const matches = [
      makeCalendarMatch({ id: 1, date: "2026-09-12T15:00:00.000Z" }),
      makeCalendarMatch({ id: 2, date: "2026-09-12T10:00:00.000Z" }),
    ];

    const groups = buildMonthAgenda(matches, [], 2026, 9);

    expect(groups[0]!.matches.map((m) => m.id)).toEqual([2, 1]);
  });

  it("returns an empty array for a month with no items", () => {
    expect(buildMonthAgenda([], [], 2026, 9)).toEqual([]);
  });
});

// ── groupFeedByDay ────────────────────────────────────────────────────────

describe("groupFeedByDay", () => {
  it("buckets matches + events under their local day, time-sorted", () => {
    const map = groupFeedByDay(
      [
        makeCalendarMatch({ id: 1, date: "2026-09-12T15:00:00" }),
        makeCalendarMatch({ id: 2, date: "2026-09-12T10:00:00" }),
        makeCalendarMatch({ id: 3, date: "2026-09-13T10:00:00" }),
      ],
      [makeCalendarEvent({ id: "e1", dateStart: "2026-09-12T18:00:00" })],
    );

    expect(map.get("2026-09-12")!.matches.map((m) => m.id)).toEqual([2, 1]);
    expect(map.get("2026-09-12")!.events.map((e) => e.id)).toEqual(["e1"]);
    expect(map.get("2026-09-13")!.matches.map((m) => m.id)).toEqual([3]);
    expect(map.has("2026-09-14")).toBe(false);
  });

  it("surfaces a multi-day event under every spanned day (inclusive)", () => {
    const map = groupFeedByDay(
      [],
      [
        makeCalendarEvent({
          id: "e1",
          dateStart: "2026-09-12T10:00:00",
          dateEnd: "2026-09-14T18:00:00",
        }),
      ],
    );
    expect(map.get("2026-09-12")!.events.map((e) => e.id)).toEqual(["e1"]);
    expect(map.get("2026-09-13")!.events.map((e) => e.id)).toEqual(["e1"]);
    expect(map.get("2026-09-14")!.events.map((e) => e.id)).toEqual(["e1"]);
    expect(map.has("2026-09-15")).toBe(false);
  });

  it("time-sorts each day's matches and events", () => {
    const matches = [
      makeCalendarMatch({ id: 1, date: "2026-09-12T15:00:00" }),
      makeCalendarMatch({ id: 2, date: "2026-09-12T10:00:00" }),
    ];
    const events = [
      makeCalendarEvent({ id: "e1", dateStart: "2026-09-12T18:00:00" }),
    ];
    const map = groupFeedByDay(matches, events);
    expect(map.get("2026-09-12")!.matches.map((m) => m.id)).toEqual([2, 1]);
    expect(map.get("2026-09-12")!.events.map((e) => e.id)).toEqual(["e1"]);
  });
});

// ── buildKalenderItemListEntries (ItemList JSON-LD source) ─────────────────

describe("buildKalenderItemListEntries", () => {
  const SITE = "https://kcvvelewijt.be";
  // 2026-09-01T00:00:00Z
  const NOW = Date.parse("2026-09-01T00:00:00.000Z");

  it("maps matches to /wedstrijd and events to their href, absolute-URLed", () => {
    const feed = buildCalendarFeed(
      [
        makeCalendarMatch({
          id: 7,
          date: "2026-09-12T10:00:00.000Z",
          homeTeam: { id: 1, name: "KCVV Elewijt" },
          awayTeam: { id: 2, name: "Zemst" },
        }),
      ],
      [
        makeEventListItem({
          id: "e1",
          title: "Spaghetti-avond",
          href: "/evenementen/spaghetti-avond",
          dateStart: "2026-09-15T18:00:00.000Z",
        }),
      ],
    );

    const entries = buildKalenderItemListEntries(feed, SITE, { nowMs: NOW });

    expect(entries).toContainEqual({
      name: "KCVV Elewijt — Zemst",
      url: "https://kcvvelewijt.be/wedstrijd/7",
    });
    expect(entries).toContainEqual({
      name: "Spaghetti-avond",
      url: "https://kcvvelewijt.be/evenementen/spaghetti-avond",
    });
  });

  it("drops past items and caps at the limit", () => {
    const feed = buildCalendarFeed(
      [
        makeCalendarMatch({ id: 1, date: "2026-08-01T10:00:00.000Z" }), // past
        makeCalendarMatch({ id: 2, date: "2026-09-10T10:00:00.000Z" }),
        makeCalendarMatch({ id: 3, date: "2026-09-11T10:00:00.000Z" }),
      ],
      [],
    );

    const entries = buildKalenderItemListEntries(feed, SITE, {
      nowMs: NOW,
      limit: 1,
    });

    expect(entries).toHaveLength(1);
    expect(entries[0]!.url).toBe("https://kcvvelewijt.be/wedstrijd/2");
  });
});
