import { describe, expect, it } from "vitest";
import { buildEventIcs } from "./event-ics";

const NOW = "2026-06-03T10:00:00Z";

describe("buildEventIcs", () => {
  it("wraps a single timed event in a valid VCALENDAR/VEVENT envelope", () => {
    const ics = buildEventIcs({
      uid: "spaghetti-avond@kcvvelewijt.be",
      title: "Spaghetti-avond",
      dateStart: "2026-09-12T16:00:00Z",
      dateEnd: "2026-09-12T20:00:00Z",
      location: "Sportpark Driesput",
      description: "Smakelijk!",
      url: "https://kcvvelewijt.be/evenementen/spaghetti-avond",
      now: NOW,
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("UID:spaghetti-avond@kcvvelewijt.be");
    expect(ics).toContain("SUMMARY:Spaghetti-avond");
    expect(ics).toContain("LOCATION:Sportpark Driesput");
    expect(ics).toContain("DESCRIPTION:Smakelijk!");
    expect(ics).toContain(
      "URL:https://kcvvelewijt.be/evenementen/spaghetti-avond",
    );
    expect(ics).toContain("END:VEVENT");
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    // CRLF line endings (RFC 5545).
    expect(ics).toContain("\r\n");
  });

  it("emits UTC basic-format DTSTART/DTEND for a timed event", () => {
    const ics = buildEventIcs({
      uid: "x@kcvvelewijt.be",
      title: "X",
      dateStart: "2026-09-12T16:00:00Z",
      dateEnd: "2026-09-12T20:00:00Z",
      now: NOW,
    });
    expect(ics).toContain("DTSTART:20260912T160000Z");
    expect(ics).toContain("DTEND:20260912T200000Z");
    expect(ics).toContain("DTSTAMP:20260603T100000Z");
  });

  it("omits DTEND for a timed event with no end (no fabricated duration)", () => {
    const ics = buildEventIcs({
      uid: "x@kcvvelewijt.be",
      title: "X",
      dateStart: "2026-09-12T16:00:00Z",
      now: NOW,
    });
    expect(ics).toContain("DTSTART:20260912T160000Z");
    expect(ics).not.toContain("DTEND");
  });

  it("uses VALUE=DATE with an exclusive next-day DTEND for an all-day event", () => {
    // 2026-09-11T22:00Z === 2026-09-12T00:00 Brussels → all-day.
    const ics = buildEventIcs({
      uid: "x@kcvvelewijt.be",
      title: "Opendeurdag",
      dateStart: "2026-09-11T22:00:00Z",
      now: NOW,
    });
    expect(ics).toContain("DTSTART;VALUE=DATE:20260912");
    // Single all-day event → DTEND is the next day (exclusive).
    expect(ics).toContain("DTEND;VALUE=DATE:20260913");
  });

  it("spans a multi-day all-day event to the day after the last day", () => {
    const ics = buildEventIcs({
      uid: "x@kcvvelewijt.be",
      title: "Jeugdkamp",
      // both Brussels-midnight
      dateStart: "2026-09-13T22:00:00Z", // 2026-09-14 00:00 Brussels
      dateEnd: "2026-09-15T22:00:00Z", // 2026-09-16 00:00 Brussels
      now: NOW,
    });
    expect(ics).toContain("DTSTART;VALUE=DATE:20260914");
    expect(ics).toContain("DTEND;VALUE=DATE:20260917");
  });

  it("escapes commas, semicolons, backslashes and newlines in text fields", () => {
    const ics = buildEventIcs({
      uid: "x@kcvvelewijt.be",
      title: "Quiz, drank; en\nplezier \\o/",
      dateStart: "2026-09-12T16:00:00Z",
      now: NOW,
    });
    expect(ics).toContain("SUMMARY:Quiz\\, drank\\; en\\nplezier \\\\o/");
  });

  it("folds content lines longer than 75 octets (RFC 5545 §3.1)", () => {
    const longUrl =
      "https://www.kcvvelewijt.be/evenementen/internationaal-jeugdtoernooi-2026-met-een-erg-lange-slug";
    const ics = buildEventIcs({
      uid: "x@kcvvelewijt.be",
      title: "X",
      dateStart: "2026-09-12T16:00:00Z",
      description: `Meer info: ${longUrl}`,
      url: longUrl,
      now: NOW,
    });

    const encoder = new TextEncoder();
    for (const line of ics.split("\r\n")) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }
    // The long URL line is folded — at least one continuation line (leading space).
    expect(ics).toMatch(/\r\n /);
    // Unfolding (strip CRLF + leading space) restores the original URL line.
    expect(ics.replace(/\r\n /g, "")).toContain(`URL:${longUrl}`);
  });

  it("omits optional fields when not provided", () => {
    const ics = buildEventIcs({
      uid: "x@kcvvelewijt.be",
      title: "X",
      dateStart: "2026-09-12T16:00:00Z",
      now: NOW,
    });
    expect(ics).not.toContain("LOCATION:");
    expect(ics).not.toContain("DESCRIPTION:");
    expect(ics).not.toContain("URL:");
  });
});
