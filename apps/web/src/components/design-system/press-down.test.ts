import { describe, it, expect } from "vitest";
import { CHIP_CLASSES, CHIP_LINK_CLASSES } from "./press-down";

describe("chip classes (#3328)", () => {
  it("leaves the fill and border colour to the caller", () => {
    for (const classes of [CHIP_CLASSES, CHIP_LINK_CLASSES]) {
      expect(classes).not.toMatch(
        /\b(bg|border)-(cream|warm|ink|transparent)\b/,
      );
    }
  });
});
