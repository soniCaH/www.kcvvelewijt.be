import { describe, expect, it } from "vitest";
import { initials } from "./initials";

describe("initials", () => {
  it("uses the first and last token for a full name, uppercased", () => {
    expect(initials("Luc Boons")).toBe("LB");
    expect(initials("jan de smet")).toBe("JS");
  });

  it("uses one letter when only a first name is known", () => {
    expect(initials("Anouk")).toBe("A");
    expect(initials("  wim ")).toBe("W");
  });

  it("tolerates extra whitespace between tokens", () => {
    expect(initials("  Els   Vos  ")).toBe("EV");
  });

  it("returns an empty string when there is nothing to derive from", () => {
    expect(initials(undefined)).toBe("");
    expect(initials(null)).toBe("");
    expect(initials("   ")).toBe("");
  });
});
