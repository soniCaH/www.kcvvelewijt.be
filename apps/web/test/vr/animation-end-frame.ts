/**
 * Pure predicate behind the "enter animation not on its final frame" throw in
 * `.storybook/test-runner.ts`'s `postVisit` (#3314). `DETERMINISM_STYLESHEET`
 * forces every CSS animation to zero duration; Storybook's `pauseAnimations`
 * parks them paused at `animation-direction: reverse`. Left to that pairing, a
 * `fill: both` animation showed its FIRST frame, so `.spotlight-pop` froze at
 * `opacity: 0` and all 21 organigram-explorer baselines were empty.
 *
 * The page side (`collectCssAnimations` in test-runner.ts) must be
 * self-contained — imported helpers do not exist in the page context — so it
 * only returns plain {@link CssAnimationSample}s; the decision lives here so a
 * Vitest test can exercise it without a Playwright page.
 */
export interface CssAnimationSample {
  name: string;
  /** `KeyframeEffect.getComputedTiming().fill`. */
  fill: string;
  /** Transformed progress (direction applied): 1 is the `to` keyframe. */
  progress: number | null | undefined;
  /** Human label of the animated element, for the error message. */
  target: string;
}

/**
 * One message line per animation that keeps a frame on screen (`forwards` /
 * `both` fill) without being on its final one. `fill: none`/`auto` leaves
 * nothing held after the animation ends, so it is never reported.
 */
export function animationsNotOnFinalFrame(
  samples: readonly CssAnimationSample[],
): string[] {
  return samples
    .filter(
      (sample) =>
        (sample.fill === "forwards" || sample.fill === "both") &&
        sample.progress !== 1,
    )
    .map(
      (sample) =>
        `${sample.name} on ${sample.target} (progress ${sample.progress})`,
    );
}
