import { describe, expect, it } from "vitest";
import { sanitizeQuery } from "./sanitize-query";

describe("sanitizeQuery", () => {
  it.each(["0475 12 34 56", "+32 475 12 34 56", "0475123456", "0475/12.34-56"])(
    "redacts the phone number %s",
    (phone) => {
      const out = sanitizeQuery(`bel ${phone} nu`);
      expect(out).not.toMatch(/\d/);
      expect(out).toBe("bel [redacted] nu");
    },
  );

  it("redacts an email address", () => {
    const out = sanitizeQuery("mail jan.peeters@example.be graag");
    expect(out).not.toMatch(/@|jan|example/);
    expect(out).toBe("mail [redacted] graag");
  });

  it("redacts an email address that contains digits", () => {
    expect(sanitizeQuery("jan123456789@example.be")).toBe("[redacted]");
  });

  it.each([
    ["u13 training", "u13 training"],
    ["Kaat", "kaat"],
    ["05/10/2026", "05/10/2026"],
  ])("passes %s through lowercased", (input, expected) => {
    expect(sanitizeQuery(input)).toBe(expected);
  });

  it("lowercases and truncates to 50 characters", () => {
    expect(sanitizeQuery("A".repeat(60))).toBe("a".repeat(50));
  });

  it("does not half-leak a phone number that sits across the cut", () => {
    const out = sanitizeQuery(`${"a".repeat(44)} 0475 12 34 56`);
    expect(out).not.toMatch(/\d/);
    expect(out.length).toBeLessThanOrEqual(50);
  });
});
