import { describe, it, expect } from "vitest";
import {
  resolveEventDate,
  resolveEventRange,
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

describe("resolveEventRange", () => {
  it("returns `none` when the start date is missing or invalid", () => {
    expect(resolveEventRange(undefined, "2026-04-26").kind).toBe("none");
    expect(resolveEventRange("2027-02-29", "2027-03-01").kind).toBe("none");
  });

  it("returns `single` when endDate is absent", () => {
    const out = resolveEventRange("2026-04-25");
    expect(out.kind).toBe("single");
  });

  it("returns `single` when endDate equals the start date", () => {
    const out = resolveEventRange("2026-04-25", "2026-04-25");
    expect(out.kind).toBe("single");
  });

  it("returns `single` when endDate is invalid — start date still renders", () => {
    const out = resolveEventRange("2026-04-25", "not-a-date");
    expect(out.kind).toBe("single");
  });

  it("treats an inverted endDate as `single` rather than silently reversing", () => {
    // The schema validates `endDate >= date`, but drafts can slip
    // through. Safer to render the start date alone than to reverse
    // the range without the editor's consent.
    const out = resolveEventRange("2026-04-25", "2026-04-20");
    expect(out.kind).toBe("single");
  });

  it("returns `range` with sameMonth=true for a weekend within one month", () => {
    const out = resolveEventRange("2026-04-25", "2026-04-26");
    if (out.kind !== "range") throw new Error("expected range");
    expect(out.start.day).toBe("25");
    expect(out.end.day).toBe("26");
    expect(out.sameMonth).toBe(true);
    expect(out.sameYear).toBe(true);
  });

  it("returns `range` with sameMonth=false for cross-month events", () => {
    const out = resolveEventRange("2026-04-30", "2026-05-02");
    if (out.kind !== "range") throw new Error("expected range");
    expect(out.sameMonth).toBe(false);
    expect(out.sameYear).toBe(true);
  });

  it("returns `range` with sameYear=false for cross-year events", () => {
    const out = resolveEventRange("2026-12-30", "2027-01-02");
    if (out.kind !== "range") throw new Error("expected range");
    expect(out.sameMonth).toBe(false);
    expect(out.sameYear).toBe(false);
  });

  describe("with sessions", () => {
    it("returns `sessions` for two or more valid sessions — sorted chronologically", () => {
      // Sessions entered out of order — resolver must sort them so
      // the span is deterministic and UI rendering is predictable.
      const out = resolveEventRange(undefined, undefined, [
        { date: "2026-11-21", startTime: "17:00", endTime: "23:00" },
        { date: "2026-11-20", startTime: "18:00", endTime: "22:00" },
        { date: "2026-11-22", startTime: "11:30", endTime: "15:00" },
      ]);
      if (out.kind !== "sessions") throw new Error("expected sessions");
      expect(out.sessions).toHaveLength(3);
      expect(out.sessions[0].date.day).toBe("20");
      expect(out.sessions[1].date.day).toBe("21");
      expect(out.sessions[2].date.day).toBe("22");
      expect(out.start.day).toBe("20");
      expect(out.end.day).toBe("22");
      expect(out.sameMonth).toBe(true);
      expect(out.sameYear).toBe(true);
    });

    it("collapses a one-session array to `single` kind", () => {
      const out = resolveEventRange(undefined, undefined, [
        { date: "2026-11-20", startTime: "18:00", endTime: "22:00" },
      ]);
      expect(out.kind).toBe("single");
    });

    it("ignores session rows with an invalid date but keeps the valid ones", () => {
      const out = resolveEventRange(undefined, undefined, [
        { date: "not-a-date" },
        { date: "2026-11-20", startTime: "18:00", endTime: "22:00" },
        { date: "2027-02-29" },
        { date: "2026-11-21", startTime: "17:00", endTime: "23:00" },
      ]);
      if (out.kind !== "sessions") throw new Error("expected sessions");
      expect(out.sessions).toHaveLength(2);
    });

    it("sessions override top-level date / endDate — precedence is correct", () => {
      const out = resolveEventRange("2028-01-01", "2028-01-05", [
        { date: "2026-11-20", startTime: "18:00" },
        { date: "2026-11-21", startTime: "17:00" },
      ]);
      if (out.kind !== "sessions") throw new Error("expected sessions");
      expect(out.start.year).toBe("2026");
      expect(out.end.year).toBe("2026");
    });

    it("falls back to top-level date/endDate when every session is invalid", () => {
      // Safety net — an editor might leave session rows empty while
      // filling the top-level date. The resolver shouldn't drop into
      // `none` just because sessions is a non-empty array of junk.
      const out = resolveEventRange("2026-04-25", undefined, [
        { date: "invalid" },
        { date: "" },
      ]);
      expect(out.kind).toBe("single");
    });
  });
});

describe("DEFAULT_TICKET_LABEL", () => {
  it("is Dutch 'Inschrijven' — matches the schema default", () => {
    expect(DEFAULT_TICKET_LABEL).toBe("Inschrijven");
  });
});
