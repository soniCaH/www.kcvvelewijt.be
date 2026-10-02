/**
 * Proves the `FOCUS_RING_PATTERN` `kcvv/no-per-component-focus-ring` selector
 * in `eslint.config.mjs` (#3368) fires. The site has ONE focus ring
 * (`globals.css`, `:focus-visible`); a per-component ring or an `outline-none`
 * either recolours it or hides it. An esquery selector that fails to parse
 * fails *silently* — the rule loads, `lint` exits 0, and nothing is checked —
 * so this needs violations that must be reported, and forms that must not be.
 */
import { join } from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { eslintForRule, lintFixtures, webDir } from "./eslint-rule-harness";

const eslint = eslintForRule("kcvv/no-per-component-focus-ring");

const PER_COMPONENT_RINGS = [
  'const a = "focus-visible:outline-2 focus-visible:outline-ink";',
  'const b = "focus-visible:outline-offset-2";',
  'const c = "focus-visible:ring-2 focus-visible:ring-jersey-deep";',
  'const d = "focus-visible:ring-offset-2";',
  "const e = `md:focus-visible:outline-warm`;",
  'const f = "focus:ring-2";',
  'const g = "focus:outline-jersey-deep focus:outline-2";',
  // Tailwind's important-modifier and negative-offset forms.
  'const h = "!focus-visible:outline-2";',
  'const i = "focus-visible:-outline-offset-2";',
  // `outline-hidden` always hides the ring; a bare `outline-none` does too.
  'const j = "px-4 outline-hidden";',
  'const k = "focus:outline-hidden";',
  'const l = "px-4 py-4 outline-none md:px-5";',
];
const ALLOWED = [
  // A `tabIndex={-1}` scroll target is not a control: no ring is wanted.
  'const ok1 = "py-10 focus:outline-none sm:py-14";',
  // Look-alikes that are not outline/ring utilities.
  'const ok2 = "focus-visible:translate-x-1 focus-visible:shadow-none";',
  'const ok3 = "focus-on-dark focus-ring-within";',
  // A selected state, not a focus state.
  'const ok4 = "outline-jersey-deep outline-2 -outline-offset-2";',
];

let messages: Map<string, string[]>;

// Loading the Next ESLint config takes seconds; pay it here, once, outside
// every test's timeout.
beforeAll(async () => {
  messages = await lintFixtures(
    eslint,
    [...PER_COMPONENT_RINGS, ...ALLOWED],
    join(webDir, "src", "fixture.tsx"),
  );
}, 60_000);

describe("focus ring — src-file restricted-syntax rule", () => {
  it.each(PER_COMPONENT_RINGS)(
    "forbids a per-component ring or hidden outline: %s",
    (source) => {
      expect(messages.get(source)).toEqual([
        expect.stringContaining("global focus ring"),
      ]);
    },
  );

  it.each(ALLOWED)("allows %s", (source) => {
    expect(messages.get(source)).toEqual([]);
  });

  // The List Row Fill Rule's inset ring is the one sanctioned exception, and
  // it is granted per file, not per class string.
  it.each([
    "components/calendar/CalendarAgenda/CalendarAgenda.tsx",
    "components/layout/MatchStrip/MatchStripView.tsx",
  ])("does not apply to the inset-ring list row in %s", async (file) => {
    const source =
      'const row = "focus-visible:outline-2 focus-visible:outline-offset-[-2px]";';
    const [result] = await eslint.lintText(source, {
      filePath: join(webDir, "src", file),
    });
    expect(result.messages).toEqual([]);
  });
});
