import { describe, it, expect } from "vitest";
import { resolveFrom } from "./FooterTransition";

describe("resolveFrom", () => {
  it('returns "kcvv-black" for the homepage ("/")', () => {
    expect(resolveFrom("/")).toBe("kcvv-black");
  });

  it('returns "gray-100" for pages without a custom mapping', () => {
    expect(resolveFrom("/nieuws")).toBe("gray-100");
    expect(resolveFrom("/kalender")).toBe("gray-100");
  });

  it("preserves existing static mappings", () => {
    expect(resolveFrom("/sponsors")).toBe("kcvv-black");
    expect(resolveFrom("/club/geschiedenis")).toBe("kcvv-black");
  });

  it("preserves existing dynamic mappings", () => {
    expect(resolveFrom("/ploegen/eerste-ploeg")).toBe("kcvv-black");
  });
});
