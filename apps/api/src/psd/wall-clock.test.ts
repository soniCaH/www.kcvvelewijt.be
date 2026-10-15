import { describe, it, expect } from "vitest";
import {
  kickoffMs,
  startOfBrusselsDayMs,
  wallClockToInstantMs,
} from "./wall-clock";

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

describe("startOfBrusselsDayMs", () => {
  it.each([
    ["winter", "2026-01-17T14:00:00.000Z", "2026-01-16T23:00:00.000Z"],
    ["summer", "2026-07-19T13:00:00.000Z", "2026-07-18T22:00:00.000Z"],
    // 23:30 UTC on the 18th is already the 19th in Brussels (summer)
    [
      "UTC day behind Brussels",
      "2026-07-18T23:30:00.000Z",
      "2026-07-18T22:00:00.000Z",
    ],
    [
      "spring-forward day",
      "2026-03-29T13:00:00.000Z",
      "2026-03-28T23:00:00.000Z",
    ],
    ["fall-back day", "2026-10-25T14:00:00.000Z", "2026-10-24T22:00:00.000Z"],
  ])("%s: midnight in Brussels", (_label, nowIso, startIso) => {
    expect(
      new Date(startOfBrusselsDayMs(Date.parse(nowIso))).toISOString(),
    ).toBe(startIso);
  });
});
