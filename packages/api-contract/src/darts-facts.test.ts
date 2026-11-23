import { describe, it, expect } from "vitest";
import { dartsPriceAmount, isDartsSignupClosed } from "./darts-facts";

describe("isDartsSignupClosed", () => {
  const EVENT = "2026-12-19";

  it("stays open on the event day, even late in the evening", () => {
    // 23:30 Brussels time on 19/12 is 22:30 UTC.
    expect(isDartsSignupClosed(EVENT, new Date("2026-12-19T22:30:00Z"))).toBe(
      false,
    );
  });

  it("stays open before the event day", () => {
    expect(isDartsSignupClosed(EVENT, new Date("2026-11-20T10:00:00Z"))).toBe(
      false,
    );
  });

  it("closes once the Brussels calendar day has moved past the event day", () => {
    // 00:30 Brussels time on 20/12 is 23:30 UTC on 19/12.
    expect(isDartsSignupClosed(EVENT, new Date("2026-12-19T23:30:00Z"))).toBe(
      true,
    );
  });
});

describe("dartsPriceAmount", () => {
  it("reads the amount out of the price text", () => {
    expect(dartsPriceAmount("€ 30 per ploeg")).toBe("€30");
  });

  it("falls back to the whole text when no amount is found", () => {
    expect(dartsPriceAmount("gratis")).toBe("gratis");
  });
});
