import { afterEach, describe, it, expect, vi } from "vitest";
import {
  formatArticleDate,
  formatWidgetDate,
  formatMatchDayMonth,
  formatMatchWidgetDate,
  isMatchDay,
  kickoffMs,
  clubDayStart,
  toDisplayZone,
  toMatchDisplayZone,
} from "./dates";

/**
 * These formatters render Belgian wall-clock, not the runtime's zone. Vercel is
 * UTC and the browser is the visitor's own zone, and `<MatchStripView>` is a
 * client component that formats in both — so an unpinned late-evening kickoff
 * would render one calendar date on the server and the next after hydration.
 */
describe("Belgian display zone", () => {
  it("rolls a late CEST publish onto the next Belgian day", () => {
    // 22:30 UTC is 00:30 the following day in Brussels (summer, +02:00).
    expect(formatWidgetDate("2026-08-03T22:30:00Z")).toBe("Di 4 augustus");
  });

  it("rolls a late CET publish onto the next Belgian day", () => {
    // 23:30 UTC is 00:30 the following day in Brussels (winter, +01:00).
    expect(formatWidgetDate("2026-01-15T23:30:00Z")).toBe("Vr 16 januari");
  });

  it("treats a Date instance the same as the equivalent ISO string", () => {
    const iso = "2026-08-03T22:30:00Z";
    expect(formatWidgetDate(new Date(iso))).toBe(formatWidgetDate(iso));
    expect(toDisplayZone(new Date(iso)).toISO()).toBe(
      toDisplayZone(iso).toISO(),
    );
  });

  it("leaves an ordinary afternoon on its own day", () => {
    expect(formatWidgetDate("2026-08-08T16:00:00Z")).toBe("Za 8 augustus");
  });

  it("returns empty output for an invalid date", () => {
    expect(formatWidgetDate("not-a-date")).toBe("");
  });

  it("reads offset-less input as UTC, not as the runtime's zone", () => {
    // The stored contract. Read as UTC this is 23:30 → 01:30 Brussels on the
    // 4th; read as runtime-local on a UTC host it would be the same, which is
    // exactly why the bug survived — assert the Brussels day, not the host's.
    expect(formatWidgetDate("2026-08-03T23:30:00")).toBe("Di 4 augustus");
  });
});

/**
 * `formatArticleDate` was the one `dates.ts` export not routed through the
 * shared parse: bare `DateTime.fromISO`, so it took the runtime zone and had no
 * validity guard. #2402 deferred the fix here (#2430 rule 3).
 */
describe("formatArticleDate", () => {
  it("renders the Belgian day for an article published just before UTC midnight", () => {
    // Published 23:30 UTC on the 15th → 01:30 Brussels on the 16th. The site
    // showed the 15th; the 16th is the correction.
    expect(formatArticleDate("2026-01-15T23:30:00Z")).toBe("16 januari 2026");
  });

  it("renders an ordinary daytime publish unchanged", () => {
    expect(formatArticleDate("2024-01-15T10:00:00Z")).toBe("15 januari 2024");
  });

  it("returns empty output for an invalid date", () => {
    expect(formatArticleDate("not-a-date")).toBe("");
  });

  it("agrees between a Date instance and its ISO string", () => {
    const iso = "2026-01-15T23:30:00Z";
    expect(formatArticleDate(new Date(iso))).toBe(formatArticleDate(iso));
  });
});

/**
 * A BFF match date is not an instant: `parseDateString` in the Workers app
 * builds it with `Date.UTC(…)` from PSD's Belgian local kickoff string, so its
 * UTC fields already *are* wall-clock. The two parses must therefore disagree
 * on a late kickoff — that disagreement is the whole point of having both.
 */
describe("toMatchDisplayZone", () => {
  it("keeps a 22:00 kickoff on its own day where toDisplayZone would not", () => {
    // The Date a BFF `Match` carries for a 22:00 Belgian kickoff on 3 August.
    const kickoff = new Date(Date.UTC(2026, 7, 3, 22, 0));
    expect(toMatchDisplayZone(kickoff).toISODate()).toBe("2026-08-03");
    expect(toDisplayZone(kickoff).toISODate()).toBe("2026-08-04");
  });

  it("agrees with toDisplayZone for an ordinary afternoon kickoff", () => {
    const kickoff = new Date(Date.UTC(2026, 7, 8, 15, 0));
    expect(toMatchDisplayZone(kickoff).toISODate()).toBe(
      toDisplayZone(kickoff).toISODate(),
    );
  });

  it("reads the kickoff hour off UTC rather than converting it", () => {
    const kickoff = new Date(Date.UTC(2026, 7, 8, 15, 0));
    expect(toMatchDisplayZone(kickoff).toFormat("HH:mm")).toBe("15:00");
  });

  it("carries the nl locale so callers format without re-stating it", () => {
    const kickoff = new Date(Date.UTC(2026, 8, 12, 15, 0));
    expect(toMatchDisplayZone(kickoff).toFormat("cccc d MMMM yyyy")).toBe(
      "zaterdag 12 september 2026",
    );
  });

  /**
   * `/kalender` carries its matches as ISO strings (`CalendarMatch.date` is
   * `match.date.toISOString()`), so the wall-clock parse has to accept the
   * serialised form of the same value or that route is forced back onto the
   * instant parse.
   */
  it("reads a serialised match date the same as the Date it came from", () => {
    const kickoff = new Date(Date.UTC(2026, 7, 3, 22, 0));
    expect(toMatchDisplayZone(kickoff.toISOString()).toISO()).toBe(
      toMatchDisplayZone(kickoff).toISO(),
    );
  });

  it("reads an offset-less serialised match date as wall-clock too", () => {
    expect(toMatchDisplayZone("2026-08-03T22:00:00").toFormat("HH:mm")).toBe(
      "22:00",
    );
  });
});

/**
 * The widget and day/month shapes over the match parse. `<MatchStrip>`,
 * `<UpcomingMatches>` and an article's match block all render one of them for a
 * fixture, while `<EventDetailBlock>` renders the widget shape for a Sanity
 * datetime — so the fork is at the parse and not at the format.
 */
describe("match-date formatters", () => {
  it("keeps a 22:00 kickoff on its own day where the instant parse would not", () => {
    const kickoff = new Date(Date.UTC(2026, 7, 3, 22, 0));
    expect(formatMatchDayMonth(kickoff)).toEqual({ day: "3", month: "aug" });
    expect(formatMatchWidgetDate(kickoff)).toBe("Ma 3 augustus");
    // The disagreement is the point — the instant parse rolls it over.
    expect(formatWidgetDate(kickoff)).toBe("Di 4 augustus");
  });

  it("renders an ordinary afternoon kickoff identically to the instant parse", () => {
    const kickoff = new Date(Date.UTC(2026, 7, 8, 15, 0));
    expect(formatMatchWidgetDate(kickoff)).toBe(formatWidgetDate(kickoff));
    expect(formatMatchDayMonth(kickoff)).toEqual({ day: "8", month: "aug" });
  });

  it("returns empty output for an invalid date", () => {
    expect(formatMatchWidgetDate(new Date(NaN))).toBe("");
    expect(formatMatchDayMonth(new Date(NaN))).toEqual({ day: "", month: "" });
  });
});

/**
 * #2616 — the comparison `<MatchStrip>` needs to relabel a fixture as "today".
 * `toMatchDisplayZone`'s parse is already covered above (#2601/#2604); this
 * only exercises the comparison, so every case passes an explicit
 * `referenceDay` rather than freezing the system clock.
 */
describe("isMatchDay", () => {
  it("is true for a match on the reference day", () => {
    const kickoff = new Date(Date.UTC(2026, 7, 8, 15, 0));
    expect(isMatchDay(kickoff, "2026-08-08")).toBe(true);
  });

  it("is false for a match the day before the reference day", () => {
    const kickoff = new Date(Date.UTC(2026, 7, 8, 15, 0));
    expect(isMatchDay(kickoff, "2026-08-09")).toBe(false);
  });

  it("is false for a match the day after the reference day", () => {
    const kickoff = new Date(Date.UTC(2026, 7, 8, 15, 0));
    expect(isMatchDay(kickoff, "2026-08-07")).toBe(false);
  });

  it("reads a late kickoff on its own Belgian day, not the day a naive UTC read would roll it onto", () => {
    // 22:00 Belgian kickoff on 3 August, carried as a BFF wall-clock Date —
    // `toDisplayZone` would roll this onto the 4th (see the parse tests
    // above); `isMatchDay` must agree with `toMatchDisplayZone` instead.
    const kickoff = new Date(Date.UTC(2026, 7, 3, 22, 0));
    expect(isMatchDay(kickoff, "2026-08-03")).toBe(true);
    expect(isMatchDay(kickoff, "2026-08-04")).toBe(false);
  });

  it("accepts a serialised match date the same as the Date it came from", () => {
    const kickoff = new Date(Date.UTC(2026, 7, 8, 15, 0));
    expect(isMatchDay(kickoff.toISOString(), "2026-08-08")).toBe(true);
  });

  it("is false for an invalid date rather than throwing", () => {
    expect(isMatchDay("not-a-date", "2026-08-08")).toBe(false);
  });
});

describe("kickoffMs", () => {
  it("is the real instant of a Belgian 20:00 CEST kickoff, two hours after its raw UTC fields", () => {
    const date = new Date(Date.UTC(2026, 7, 3, 20, 0));
    expect(kickoffMs({ date })).toBe(Date.UTC(2026, 7, 3, 18, 0));
  });
});

describe("clubDayStart", () => {
  afterEach(() => vi.useRealTimers());

  it("is Brussels midnight in CEST (UTC+2), rolled over at 22:00 UTC", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-16T22:30:00Z")); // 00:30 on the 17th
    expect(clubDayStart()).toBe("2026-10-16T22:00:00.000Z");
  });

  it("is Brussels midnight in CET (UTC+1)", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-12-10T08:00:00Z"));
    expect(clubDayStart()).toBe("2026-12-09T23:00:00.000Z");
  });

  it("follows the DST change day (25 Oct 2026, clocks go back at 03:00)", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-25T12:00:00Z"));
    expect(clubDayStart()).toBe("2026-10-24T22:00:00.000Z");
  });
});
