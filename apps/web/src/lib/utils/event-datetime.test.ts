import { describe, expect, it } from "vitest";
import {
  formatEventDays,
  isMultiDayEvent,
  parseEventDateTime,
} from "./event-datetime";

const at = (iso: string) => parseEventDateTime(iso);

describe("isMultiDayEvent", () => {
  it("is true only when the end falls on a later Brussels day", () => {
    const start = at("2026-10-10T12:00:00Z");
    expect(isMultiDayEvent(start, at("2026-10-11T08:00:00Z"))).toBe(true);
    expect(isMultiDayEvent(start, at("2026-10-10T20:00:00Z"))).toBe(false);
    expect(isMultiDayEvent(start, at("2026-10-09T12:00:00Z"))).toBe(false);
    expect(isMultiDayEvent(start, null)).toBe(false);
  });

  it("an evening that ends at midnight is one day; an all-day span to a midnight is two", () => {
    // 20:00 → 00:00 Brussels (summer time, UTC+2).
    expect(
      isMultiDayEvent(at("2026-10-17T18:00:00Z"), at("2026-10-17T22:00:00Z")),
    ).toBe(false);
    // All-day 17 → 18 October, both stored as Brussels midnight.
    expect(
      isMultiDayEvent(at("2026-10-16T22:00:00Z"), at("2026-10-17T22:00:00Z")),
    ).toBe(true);
  });

  it("reads the day in Brussels, not UTC", () => {
    // 21:30 UTC on the 10th is already the 11th in Brussels.
    expect(
      isMultiDayEvent(at("2026-10-10T20:00:00Z"), at("2026-10-10T22:30:00Z")),
    ).toBe(true);
  });
});

describe("formatEventDays", () => {
  it("prints one day for a single-day event", () => {
    expect(formatEventDays(at("2026-10-17T12:00:00Z"), null)).toBe(
      "zaterdag 17 oktober",
    );
  });

  it("names the month once when both days share it", () => {
    expect(
      formatEventDays(at("2026-10-17T12:00:00Z"), at("2026-10-18T16:00:00Z")),
    ).toBe("zaterdag 17 – zondag 18 oktober");
  });

  it("names both months when the span crosses one", () => {
    expect(
      formatEventDays(at("2026-10-31T12:00:00Z"), at("2026-11-01T16:00:00Z")),
    ).toBe("zaterdag 31 oktober – zondag 1 november");
  });

  it("is empty for an invalid start", () => {
    expect(formatEventDays(at("nope"), null)).toBe("");
  });
});
