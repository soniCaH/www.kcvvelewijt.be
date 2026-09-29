/**
 * Proves the `OFF_RAMP_LEADING_PATTERN` `kcvv/no-off-ramp-leading` selector in
 * `eslint.config.mjs` (#2666) fires. An esquery selector that fails to parse
 * fails *silently* — the rule loads, `lint` exits 0, and nothing is checked —
 * so this needs a violation that must be reported, and the three named
 * `@theme` leading steps (#2667) that must not be.
 */
import { join } from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { eslintForRule, lintFixtures, webDir } from "./eslint-rule-harness";

const eslint = eslintForRule("kcvv/no-off-ramp-leading");

const OFF_RAMP_LEADING = [
  'const a = "leading-none";',
  'const b = "leading-tight";',
  'const c = "leading-[1.05]";',
  'const d = "leading-(--x)";',
  'const e = "leading-6";',
  "const f = `sm:leading-relaxed`;",
  // Tailwind's important-modifier prefix — the anchor must include `!`
  // alongside start-of-string/whitespace/`:`, or this slips past.
  'const g = "!leading-none";',
];
const ALLOWED = [
  // The only legal leading-* utilities — the named @theme steps (#2667).
  'const ok = "leading-hero";',
  'const ok2 = "leading-hero-lead";',
  'const ok3 = "leading-label-wrap";',
  // Looks like it starts with "leading-" but isn't a leading utility at
  // all — a prose/test id an allowlist form would have wrongly caught.
  'const ok4 = "leading-glyph";',
];

let messages: Map<string, string[]>;

// Loading the Next ESLint config takes seconds; pay it here, once, outside
// every test's timeout.
beforeAll(async () => {
  messages = await lintFixtures(
    eslint,
    [...OFF_RAMP_LEADING, ...ALLOWED],
    join(webDir, "src", "fixture.tsx"),
  );
}, 60_000);

describe("leading freeze — src-file restricted-syntax rule", () => {
  it.each(OFF_RAMP_LEADING)(
    "forbids an off-ramp leading utility: %s",
    (source) => {
      expect(messages.get(source)).toEqual([
        expect.stringContaining("Off-ramp leading"),
      ]);
    },
  );

  it.each(ALLOWED)("allows %s", (source) => {
    expect(messages.get(source)).toEqual([]);
  });
});
