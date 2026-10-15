import { describe, it, expect } from "vitest";
import { parseCeiling, parseCount } from "./daily-ceiling";

describe("parseCeiling (#3468)", () => {
  it("accepts 0 as a kill switch that refuses everything", () => {
    expect(parseCeiling("0")).toBe(0);
  });

  it.each([undefined, "", "abc", "-1"])("reads %j as no ceiling", (raw) => {
    expect(parseCeiling(raw)).toBeUndefined();
  });
});

describe("parseCount", () => {
  it.each([
    [null, 0],
    ["NaN", 0],
    ["41", 41],
  ])("reads %j as %d", (raw, expected) => {
    expect(parseCount(raw)).toBe(expected);
  });
});
