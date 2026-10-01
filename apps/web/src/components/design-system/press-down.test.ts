import { describe, it, expect } from "vitest";
import {
  CHIP_BASE_CLASSES,
  CHIP_CLASSES,
  PRESS_DOWN_CLASSES,
} from "./press-down";

describe("chip classes (#3328)", () => {
  const tokens = (s: string) => s.split(/\s+/);

  it("is UpLink's size, border and type, with the canonical press-down", () => {
    for (const token of [
      "border-2",
      "px-3",
      "py-2",
      "text-label",
      "font-mono",
      "font-semibold",
      "uppercase",
      ...tokens(PRESS_DOWN_CLASSES),
    ]) {
      expect(tokens(CHIP_BASE_CLASSES)).toContain(token);
    }
  });

  it("carries the ink paper shadow, which the base leaves out for tone-swapped chips", () => {
    expect(tokens(CHIP_BASE_CLASSES)).not.toContain("shadow-paper-sm");
    expect(tokens(CHIP_CLASSES)).toContain("shadow-paper-sm");
  });

  it("leaves the fill and border colour to the caller", () => {
    expect(CHIP_CLASSES).not.toMatch(
      /\b(bg|border)-(cream|warm|ink|transparent)\b/,
    );
  });
});
