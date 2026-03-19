import { describe, expect, it } from "vitest";
import type { Match } from "@kcvv/api-contract";
import { generateIcal, normalizeCacheKey } from "./ical";

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 12345,
    date: new Date("2025-03-22T14:00:00.000Z"),
    time: "15:00",
    venue: undefined,
    home_team: { id: 1, name: "KCVV Elewijt", score: undefined },
    away_team: { id: 2, name: "KFC Turnhout", score: undefined },
    status: "scheduled",
    round: "Speeldag 20",
    competition: "2e Nationale",
    ...overrides,
  } as Match;
}

describe("generateIcal", () => {
  it("generates a valid iCal with a scheduled match", () => {
    const matches = [makeMatch()];
    const output = generateIcal(matches);

    expect(output).toContain("BEGIN:VCALENDAR");
    expect(output).toContain("KCVV Elewijt//Wedstrijdkalender//NL");
    expect(output).toContain("X-WR-CALNAME:KCVV Elewijt");
    expect(output).toContain("BEGIN:VEVENT");
    expect(output).toContain("SUMMARY:KCVV Elewijt - KFC Turnhout");
    expect(output).toContain("kcvv-match-12345@kcvvelewijt.be");
    expect(output).toContain("https://www.kcvvelewijt.be/game/12345");
    expect(output).toContain("2e Nationale — Speeldag 20");
    expect(output).toContain("END:VCALENDAR");
  });

  it("shows score in SUMMARY for finished matches", () => {
    const match = makeMatch({
      status: "finished",
      home_team: { id: 1, name: "KCVV Elewijt", score: 3 },
      away_team: { id: 2, name: "KFC Turnhout", score: 1 },
    } as Partial<Match>);
    const output = generateIcal([match]);

    expect(output).toContain("SUMMARY:KCVV Elewijt 3-1 KFC Turnhout");
  });

  it("uses home venue as LOCATION when provided", () => {
    const match = makeMatch({ venue: "Stadion De Kuip" });
    const output = generateIcal([match]);

    expect(output).toContain("Stadion De Kuip");
  });

  it("falls back to Sportpark Elewijt for home matches without venue", () => {
    const match = makeMatch({ venue: undefined });
    const output = generateIcal([match]);

    expect(output).toContain("Sportpark Elewijt\\, Elewijt\\, België");
  });

  it("omits LOCATION for away matches without venue", () => {
    const match = makeMatch({
      venue: undefined,
      home_team: { id: 2, name: "KFC Turnhout", score: undefined },
      away_team: { id: 1, name: "KCVV Elewijt", score: undefined },
    } as Partial<Match>);
    const output = generateIcal([match]);

    expect(output).not.toContain("LOCATION");
  });

  it("filters by side=home", () => {
    const home = makeMatch({ id: 1 });
    const away = makeMatch({
      id: 2,
      home_team: { id: 3, name: "FC Away", score: undefined },
      away_team: { id: 1, name: "KCVV Elewijt", score: undefined },
    } as Partial<Match>);
    const output = generateIcal([home, away], { side: "home" });

    expect(output).toContain("kcvv-match-1@kcvvelewijt.be");
    expect(output).not.toContain("kcvv-match-2@kcvvelewijt.be");
  });

  it("filters by side=away", () => {
    const home = makeMatch({ id: 1 });
    const away = makeMatch({
      id: 2,
      home_team: { id: 3, name: "FC Away", score: undefined },
      away_team: { id: 1, name: "KCVV Elewijt", score: undefined },
    } as Partial<Match>);
    const output = generateIcal([home, away], { side: "away" });

    expect(output).not.toContain("kcvv-match-1@kcvvelewijt.be");
    expect(output).toContain("kcvv-match-2@kcvvelewijt.be");
  });

  it("deduplicates matches by id", () => {
    const match1 = makeMatch({ id: 100 });
    const match2 = makeMatch({ id: 100 });
    const output = generateIcal([match1, match2]);

    const eventCount = output.split("BEGIN:VEVENT").length - 1;
    expect(eventCount).toBe(1);
  });

  it("side=all includes all matches", () => {
    const home = makeMatch({ id: 1 });
    const away = makeMatch({
      id: 2,
      home_team: { id: 3, name: "FC Away", score: undefined },
      away_team: { id: 1, name: "KCVV Elewijt", score: undefined },
    } as Partial<Match>);
    const output = generateIcal([home, away], { side: "all" });

    expect(output).toContain("kcvv-match-1@kcvvelewijt.be");
    expect(output).toContain("kcvv-match-2@kcvvelewijt.be");
  });

  it("sorts matches by date", () => {
    const earlier = makeMatch({
      id: 1,
      date: new Date("2025-03-01T14:00:00Z"),
    });
    const later = makeMatch({
      id: 2,
      date: new Date("2025-04-01T14:00:00Z"),
    });
    const output = generateIcal([later, earlier]);

    const idx1 = output.indexOf("kcvv-match-1@kcvvelewijt.be");
    const idx2 = output.indexOf("kcvv-match-2@kcvvelewijt.be");
    expect(idx1).toBeLessThan(idx2);
  });
});

describe("normalizeCacheKey", () => {
  it("sorts teamIds so order does not matter", () => {
    expect(normalizeCacheKey("2456,1235", "all")).toBe(
      normalizeCacheKey("1235,2456", "all"),
    );
  });

  it("uses 'all' when no teamIds provided", () => {
    expect(normalizeCacheKey(null, "home")).toBe("ical:all:home");
  });

  it("includes side in cache key", () => {
    expect(normalizeCacheKey("1235", "home")).toBe("ical:1235:home");
    expect(normalizeCacheKey("1235", "away")).toBe("ical:1235:away");
  });
});
