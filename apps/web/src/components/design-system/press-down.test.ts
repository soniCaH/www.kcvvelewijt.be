import { describe, it, expect } from "vitest";
import {
  CHIP_CLASSES,
  CHIP_LINK_CLASSES,
  PRESS_DOWN_CLASSES,
  PRESS_DOWN_TRANSITION,
} from "./press-down";

describe("press-down transition (#2493)", () => {
  // Tailwind v4's translate-x-*/translate-y-* set the `translate` property,
  // not `transform`: a list naming `transform` would snap the move.
  it("names translate, not transform, for the translate-* press", () => {
    expect(PRESS_DOWN_TRANSITION).toContain("translate");
    expect(PRESS_DOWN_TRANSITION).not.toMatch(/\btransform\b/);
    expect(PRESS_DOWN_CLASSES).toContain(PRESS_DOWN_TRANSITION);
    expect(PRESS_DOWN_CLASSES).toContain("motion-safe:hover:translate-x-1");
  });
});

describe("chip classes (#3328)", () => {
  it("leaves the fill and border colour to the caller", () => {
    for (const classes of [CHIP_CLASSES, CHIP_LINK_CLASSES]) {
      expect(classes).not.toMatch(
        /\b(bg|border)-(cream|warm|ink|transparent)\b/,
      );
    }
  });
});
