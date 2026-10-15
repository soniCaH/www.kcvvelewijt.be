import { describe, it, expect } from "vitest";
import { Schema as S } from "effect";
import { DateFromStringOrDate } from "./common";

const decode = S.decodeUnknownSync(DateFromStringOrDate);

describe("DateFromStringOrDate", () => {
  it("decodes an ISO string to a Date", () => {
    expect(decode("2026-03-15T15:00:00.000Z").toISOString()).toBe(
      "2026-03-15T15:00:00.000Z",
    );
  });

  it("passes a valid Date through", () => {
    const date = new Date("2026-03-15T15:00:00.000Z");
    expect(decode(date).getTime()).toBe(date.getTime());
  });

  it("encodes a Date to an ISO string", () => {
    expect(
      S.encodeSync(DateFromStringOrDate)(new Date("2026-03-15T15:00:00.000Z")),
    ).toBe("2026-03-15T15:00:00.000Z");
  });

  it.each([
    ["an empty string", ""],
    ["a non-date string", "garbage"],
    ["an Invalid Date", new Date(NaN)],
  ])("refuses %s", (_label, input) => {
    expect(() => decode(input)).toThrow();
  });
});
