/**
 * Proves the `OFF_RAMP_FONT_SIZE_PATTERN` `kcvv/no-off-ramp-font-size`
 * selector in `eslint.config.mjs` (#2418) fires. An esquery selector that
 * fails to parse fails *silently* — the rule loads, `lint` exits 0, and
 * nothing is checked — so this needs a violation that must be reported, and
 * both a token class and an out-of-scope literal (`leading-[…]`, owned by
 * #2666) that must not be.
 */
import { join } from "node:path";

import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

import { eslintForRule, lintFixtures, webDir } from "./eslint-rule-harness";

const eslint = eslintForRule("kcvv/no-off-ramp-font-size");

const OFF_RAMP_LITERALS = [
  'const a = "text-[9px]";',
  'const b = "text-[10.5px]";',
  'const c = "text-[1.05rem]";',
  'const d = "text-[0.4em]";',
  // A bare-dot decimal — no leading digit before the `.`.
  'const dd = "text-[.8rem]";',
  'const e = "text-[length:var(--text-display-lg)]";',
  // Tailwind v4's parenthesis shorthand for the same arbitrary length.
  'const ep = "text-(length:--text-display-lg)";',
  // Computed values bypass the ramp exactly like a literal does.
  'const f = "text-[clamp(1rem,2vw,3rem)]";',
  'const g = "text-[calc(1rem+2px)]";',
  // The rest of the unit list: viewport, points, percent, character.
  'const h = "text-[14vw]";',
  'const i = "text-[12pt]";',
  'const j = "text-[50%]";',
  'const k = "text-[3ch]";',
  "const l = `text-[9px]`;",
];
const ALLOWED = [
  'const ok = "text-label";',
  // Out of scope by name — line-height literals belong to #2666, not this rule.
  'const ok2 = "leading-[1.2]";',
  // A different bracket utility entirely; must not be swept up by "text-[".
  'const ok3 = "w-[10px]";',
  // Tailwind v4's CSS-variable shorthand used for *colour*, not font-size —
  // no "length:" hint, so this is not an off-ramp font size at all.
  'const ok4 = "text-(--brand-color)";',
];

let messages: Map<string, string[]>;

// Loading the Next ESLint config takes seconds; pay it here, once, outside
// every test's timeout.
beforeAll(async () => {
  messages = await lintFixtures(
    eslint,
    [...OFF_RAMP_LITERALS, ...ALLOWED],
    join(webDir, "src", "fixture.tsx"),
  );
}, 60_000);

describe("type ramp freeze — src-file restricted-syntax rule", () => {
  it.each(OFF_RAMP_LITERALS)(
    "forbids an off-ramp literal font size: %s",
    (source) => {
      expect(messages.get(source)).toEqual([
        expect.stringContaining("Off-ramp literal font size"),
      ]);
    },
  );

  it.each(ALLOWED)("allows %s", (source) => {
    expect(messages.get(source)).toEqual([]);
  });
});

describe("rule ID separation (#2418 review finding 1)", () => {
  // Deliberately *not* `eslintForRule` here — the whole point is to run the
  // full config and see both selectors report independently, which a
  // rule-filtered instance would hide by construction.
  const fullEslint = new ESLint({ cwd: webDir });

  it("reports a frozen font-size literal and a fresh duration-700 under two different rule IDs", async () => {
    const source =
      'export const A = () => <div className="text-[11px] duration-700" />;\n';
    const [result] = await fullEslint.lintText(source, {
      filePath: join(webDir, "src", "fixture.tsx"),
    });

    // If these ever shared a rule ID, a swap of one frozen font-size literal
    // for a brand-new duration-700 in the same file would leave that rule
    // ID's suppressed count unchanged — and `lint` would stay green. Two
    // distinct rule IDs is what stops that: `eslint-suppressions.json` only
    // ever freezes `kcvv/no-off-ramp-font-size`, so a `duration-700` (under
    // plain `no-restricted-syntax`) is never a candidate for hiding there.
    expect(result.messages.map((message) => message.ruleId).sort()).toEqual([
      "kcvv/no-off-ramp-font-size",
      "no-restricted-syntax",
    ]);
  }, 60_000);
});
