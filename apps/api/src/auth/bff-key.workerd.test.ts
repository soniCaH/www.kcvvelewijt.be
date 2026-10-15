/**
 * `bffKeyMatches` against workerd's REAL `crypto.subtle.timingSafeEqual` —
 * a Workers-only extension Node does not ship, so only this project can
 * prove the comparison the worker actually runs (#3485).
 */
import { describe, it, expect, vi } from "vitest";
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

  it("still runs a constant-time compare on a length mismatch, so timing does not reveal the length", () => {
    const spy = vi.spyOn(crypto.subtle, "timingSafeEqual");
    try {
      expect(bffKeyMatches("s3cret", "s3cret-value")).toBe(false);
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      spy.mockRestore();
    }
  });

  it("refuses a missing header", () => {
    expect(bffKeyMatches(null, "s3cret-value")).toBe(false);
  });
});
