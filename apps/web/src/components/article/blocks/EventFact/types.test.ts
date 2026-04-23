import { describe, it, expect } from "vitest";
import {
  resolveEventDate,
  formatTimeRange,
  DEFAULT_TICKET_LABEL,
} from "./types";

describe("resolveEventDate", () => {
  it("parses an ISO date into Dutch month + weekday parts", () => {
    const out = resolveEventDate("2026-04-27");
    if (!out.hasDate) throw new Error("expected hasDate: true");
    expect(out.day).toBe("27");
    expect(out.monthShort).toBe("apr");
    expect(out.monthLong).toBe("april");
    expect(out.year).toBe("2026");
    // 2026-04-27 was a Monday.
    expect(out.weekday).toBe("maandag");
  });

  it("drops leading zero on single-digit days", () => {
    const out = resolveEventDate("2026-04-07");
    if (!out.hasDate) throw new Error("expected hasDate: true");
    expect(out.day).toBe("7");
  });

  it("returns `{ hasDate: false }` for undefined/empty input", () => {
    expect(resolveEventDate(undefined).hasDate).toBe(false);
    expect(resolveEventDate("").hasDate).toBe(false);
  });

  it("returns `{ hasDate: false }` for a malformed ISO string", () => {
    expect(resolveEventDate("27-04-2026").hasDate).toBe(false);
    expect(resolveEventDate("2026/04/27").hasDate).toBe(false);
  });

  it("rejects non-existent calendar dates — Luxon validates, no silent rollover", () => {
    // `new Date(Date.UTC(2027, 1, 29))` silently rolls to 2027-03-01.
    // Luxon's `.isValid` rejects it so the strip shows `Datum volgt`
    // instead of rendering "29 februari 2027".
    expect(resolveEventDate("2027-02-29").hasDate).toBe(false);
    expect(resolveEventDate("2026-04-31").hasDate).toBe(false);
    expect(resolveEventDate("2026-13-01").hasDate).toBe(false);
    expect(resolveEventDate("2026-00-01").hasDate).toBe(false);
  });

  it("uses UTC parsing so weekday doesn't drift by timezone", () => {
    // 2026-01-01 is a Thursday worldwide; if the function used local
    // time, a negative-UTC-offset runner could render it as Wednesday.
    const out = resolveEventDate("2026-01-01");
    if (!out.hasDate) throw new Error("expected hasDate: true");
    expect(out.weekday).toBe("donderdag");
  });
});

describe("formatTimeRange", () => {
  it("joins both ends with a dash when present", () => {
    expect(formatTimeRange("10:00", "17:00")).toBe("10:00 - 17:00");
  });

  it("returns just the start time when end is missing", () => {
    expect(formatTimeRange("10:00", undefined)).toBe("10:00");
  });

  it("returns just the end time when start is missing", () => {
    expect(formatTimeRange(undefined, "17:00")).toBe("17:00");
  });

  it("returns undefined when both are missing — caller skips the slot", () => {
    expect(formatTimeRange(undefined, undefined)).toBeUndefined();
    expect(formatTimeRange("", "")).toBeUndefined();
  });
});

describe("DEFAULT_TICKET_LABEL", () => {
  it("is Dutch 'Inschrijven' — matches the schema default", () => {
    expect(DEFAULT_TICKET_LABEL).toBe("Inschrijven");
  });
});
