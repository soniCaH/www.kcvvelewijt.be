/**
 * Proves the `OFF_RAMP_TRACKING_PATTERN` `kcvv/no-off-ramp-tracking` selector
 * in `eslint.config.mjs` (#2663) fires. An esquery selector that fails to
 * parse fails *silently* — the rule loads, `lint` exits 0, and nothing is
 * checked — so this needs a violation that must be reported, and a form
 * that merely starts with `tracking-` and must not be.
 */
import { join } from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { eslintForRule, lintFixtures, webDir } from "./eslint-rule-harness";

const eslint = eslintForRule("kcvv/no-off-ramp-tracking");

const OFF_RAMP_TRACKING = [
  'const a = "tracking-[0.08em]";',
  'const b = "tracking-(--x)";',
  'const c = "tracking-wide";',
  "const d = `md:tracking-tight`;",
  // Tailwind's important-modifier prefix — the anchor must include `!`
  // alongside start-of-string/whitespace/`:`, or this slips past.
  'const e = "!tracking-[0.1em]";',
  // Tailwind v4's `tracking` utility `supportsNegative` — the anchor must
  // allow a leading `-`, or this off-ramp slips past too.
  'const f = "-tracking-wide";',
];
const ALLOWED = [
  // Looks like it starts with "tracking-" but isn't a tracking utility at
  // all — a prose/test id an allowlist form would have wrongly caught.
  'const ok = "tracking-id";',
];

let messages: Map<string, string[]>;

// Loading the Next ESLint config takes seconds; pay it here, once, outside
// every test's timeout.
beforeAll(async () => {
  messages = await lintFixtures(
    eslint,
    [...OFF_RAMP_TRACKING, ...ALLOWED],
    join(webDir, "src", "fixture.tsx"),
  );
}, 60_000);

describe("tracking freeze — src-file restricted-syntax rule", () => {
  it.each(OFF_RAMP_TRACKING)(
    "forbids an off-ramp tracking utility: %s",
    (source) => {
      expect(messages.get(source)).toEqual([
        expect.stringContaining("Off-ramp tracking"),
      ]);
    },
  );

  it.each(ALLOWED)("allows %s", (source) => {
    expect(messages.get(source)).toEqual([]);
  });
});
