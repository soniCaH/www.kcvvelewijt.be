import { describe, it, expect } from "vitest";
import { parseCount } from "./daily-ceiling";

describe("parseCount", () => {
  it.each([
    [null, 0],
    ["NaN", 0],
    ["41", 41],
  ])("reads %j as %d", (raw, expected) => {
    expect(parseCount(raw)).toBe(expected);
  });
});
