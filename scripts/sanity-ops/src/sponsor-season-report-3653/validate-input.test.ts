import { describe, expect, it } from "vitest";
import { parseSpotlightWeeks, validateRange } from "./validate-input";

const RANGE = { from: "2026-07-01", to: "2027-06-30" };

describe("validateRange", () => {
  it("accepts a real range", () => {
    expect(() => validateRange(RANGE)).not.toThrow();
  });

  it.each([
    [{ from: "2026-7-1", to: "2027-06-30" }, /YYYY-MM-DD/],
    [{ from: "2026-02-30", to: "2027-06-30" }, /2026-02-30/],
    [{ from: "2027-06-30", to: "2026-07-01" }, /after/],
  ])("rejects %j", (range, message) => {
    expect(() => validateRange(range)).toThrow(message);
  });
});

describe("parseSpotlightWeeks", () => {
  const parse = (weeks: unknown) =>
    parseSpotlightWeeks(JSON.stringify(weeks), RANGE);

  it("accepts Mondays inside the range", () => {
    expect(parse({ "Garage X": ["2027-03-01"] })).toEqual({
      "Garage X": ["2027-03-01"],
    });
  });

  it.each([
    ["not json", /JSON/],
    [JSON.stringify(["2027-03-01"]), /object/],
    [JSON.stringify({ A: "2027-03-01" }), /list/],
    [JSON.stringify({ A: ["2027-02-30"] }), /real date/],
    [JSON.stringify({ A: ["2027-03-02"] }), /Monday/],
    [JSON.stringify({ A: ["2027-07-05"] }), /range/],
    [JSON.stringify({ A: ["2026-06-29"] }), /range/],
  ])("rejects %s", (text, message) => {
    expect(() => parseSpotlightWeeks(text, RANGE)).toThrow(message);
  });
});
