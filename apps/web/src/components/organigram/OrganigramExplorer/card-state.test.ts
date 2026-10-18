import { describe, expect, it } from "vitest";
import { deriveCardState } from "./card-state";

describe("deriveCardState", () => {
  it("maps holder count to occupancy state", () => {
    expect(deriveCardState(0)).toBe("vacant");
    expect(deriveCardState(1)).toBe("single");
    expect(deriveCardState(2)).toBe("shared");
    expect(deriveCardState(5)).toBe("shared");
  });

  it("treats negatives as vacant defensively", () => {
    expect(deriveCardState(-1)).toBe("vacant");
  });
});
