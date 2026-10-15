import { describe, it, expect } from "vitest";
import { kickoffMs, wallClockToInstantMs } from "./wall-clock";

const wall = (iso: string) => Date.parse(`${iso}:00Z`);

describe("wallClockToInstantMs", () => {
  it.each([
    ["winter", "2026-01-17T15:00", "2026-01-17T14:00:00.000Z"],
    ["summer", "2026-07-19T15:00", "2026-07-19T13:00:00.000Z"],
    ["spring-forward day", "2026-03-29T15:00", "2026-03-29T13:00:00.000Z"],
    ["fall-back day", "2026-10-25T15:00", "2026-10-25T14:00:00.000Z"],
    ["fall-back day, morning", "2026-10-25T11:00", "2026-10-25T10:00:00.000Z"],
    [
      "spring-forward day, morning",
      "2026-03-29T11:00",
      "2026-03-29T09:00:00.000Z",
    ],
  ])("%s: %s Brussels", (_label, wallIso, instantIso) => {
    expect(new Date(wallClockToInstantMs(wall(wallIso))).toISOString()).toBe(
      instantIso,
    );
  });
});

describe("kickoffMs", () => {
  it("accepts a Date or an ISO string carrying the wall-clock-as-UTC value", () => {
    const expected = Date.parse("2026-07-19T13:00:00.000Z");
    expect(kickoffMs(new Date("2026-07-19T15:00:00.000Z"))).toBe(expected);
    expect(kickoffMs("2026-07-19T15:00:00.000Z")).toBe(expected);
  });
});
