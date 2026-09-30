/**
 * Regression fixture for the "enter animation not on its final frame" throw in
 * `.storybook/test-runner.ts`'s `postVisit` (#3314). The decision
 * (`animationsNotOnFinalFrame`, in `animation-end-frame.ts`) is pure so it is
 * exercised here without a Playwright page.
 */
import { describe, expect, it } from "vitest";
import {
  animationsNotOnFinalFrame,
  type CssAnimationSample,
} from "./animation-end-frame";

const sample = (over: Partial<CssAnimationSample>): CssAnimationSample => ({
  name: "spotlight-pop",
  fill: "both",
  progress: 1,
  target: '<div class="spotlight-pop">',
  ...over,
});

describe("animationsNotOnFinalFrame", () => {
  it("flags a fill-both animation held on its first frame (the #3314 blank stage)", () => {
    expect(animationsNotOnFinalFrame([sample({ progress: 0 })])).toEqual([
      'spotlight-pop on <div class="spotlight-pop"> (progress 0)',
    ]);
  });

  it("flags a fill-forwards animation caught mid-way", () => {
    expect(
      animationsNotOnFinalFrame([sample({ fill: "forwards", progress: 0.4 })]),
    ).toHaveLength(1);
  });

  it("ignores animations that hold no frame (fill none / auto)", () => {
    expect(
      animationsNotOnFinalFrame([
        sample({ fill: "none", progress: 0 }),
        sample({ fill: "auto", progress: null }),
      ]),
    ).toEqual([]);
  });

  it("ignores an animation already on its final frame", () => {
    expect(animationsNotOnFinalFrame([sample({ progress: 1 })])).toEqual([]);
  });
});
