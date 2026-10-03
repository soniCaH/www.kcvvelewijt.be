/**
 * The row-rule stagger of the mobile menu (#3392, decided in #2498): each
 * row's hairline draws in 30ms after the one above it, but no rule may start
 * later than 270ms. The menu's row count is not fixed (7 fixed rows plus the
 * senior teams from `buildMenuItems`), so a bigger menu shrinks the step —
 * never the cap.
 */
export const RULE_STEP_MS = 30;
export const RULE_START_CAP_MS = 270;

/**
 * Step between two consecutive rules, in ms. Rounded down to 0.01ms so the
 * last rule (`(rows - 1) * step`) can never creep past the cap.
 */
export function ruleStepMs(rows: number): number {
  if (rows < 2) return RULE_STEP_MS;
  return Math.min(
    RULE_STEP_MS,
    Math.floor((RULE_START_CAP_MS / (rows - 1)) * 100) / 100,
  );
}
