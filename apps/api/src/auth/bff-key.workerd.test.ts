/**
 * `bffKeyMatches` against workerd's REAL `crypto.subtle.timingSafeEqual` —
 * a Workers-only extension Node does not ship, so only this project can
 * prove the comparison the worker actually runs (#3485).
 */
import { describe, it, expect } from "vitest";
import { bffKeyMatches } from "./bff-key";

describe("bffKeyMatches (real workerd crypto)", () => {
  it("accepts the equal value", () => {
    expect(bffKeyMatches("s3cret-value", "s3cret-value")).toBe(true);
  });

  it("refuses a wrong value of the same length", () => {
    expect(bffKeyMatches("s3cret-valuX", "s3cret-value")).toBe(false);
  });

  it("refuses a value of a different length without throwing", () => {
    expect(bffKeyMatches("s3cret", "s3cret-value")).toBe(false);
    expect(bffKeyMatches("s3cret-value-longer", "s3cret-value")).toBe(false);
  });

  it("refuses a missing header", () => {
    expect(bffKeyMatches(null, "s3cret-value")).toBe(false);
  });
});
