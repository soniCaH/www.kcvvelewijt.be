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
  // Variant-prefixed hides — only `focus:` is the sanctioned prefix.
  'const m = "md:outline-none";',
  'const n = "hover:outline-none";',
  'const o = "lg:focus-visible:outline-none";',
  'const p = "group-focus:outline-none";',
  // The other focus-state variants and the group/peer/has forms.
  'const q = "focus-within:ring-warm focus-within:ring-2";',
  'const r = "focus-within:outline-2";',
  'const s = "group-focus-visible:ring-2";',
  'const t = "group-focus-visible:outline-warm";',
  'const u = "peer-focus-visible:outline-2";',
  'const v = "group-focus-within:ring-2";',
  'const w = "has-[:focus-visible]:ring-2";',
  'const x = "has-[input:focus-visible]:outline-2";',
  "const y = `has-[:focus]:ring-warm`;",
  // `outline-0` hides the ring as surely as `outline-none` does.
  'const z = "px-4 outline-0";',
  'const aa = "md:outline-0";',
  'const ab = "focus:outline-0";',
];
const ALLOWED = [
  // A `tabIndex={-1}` scroll target is not a control: no ring is wanted.
  'const ok1 = "py-10 focus:outline-none sm:py-14";',
  // Look-alikes that are not outline/ring utilities.
  'const ok2 = "focus-visible:translate-x-1 focus-visible:shadow-none";',
  'const ok3 = "focus-on-dark focus-ring-within";',
  // A selected state, not a focus state.
  'const ok4 = "outline-jersey-deep outline-2 -outline-offset-2";',
  // `focus:outline-none` survives under a responsive / state prefix too.
  'const ok5 = "md:focus:outline-none";',
  // Reveal-on-focus affordances are not rings.
  'const ok6 = "group-focus-visible:opacity-100 group-focus-within:opacity-100";',
  'const ok7 = "focus-within:translate-y-1 has-[img]:p-0";',
  // The inset offset on its own: a ring only moved, never recoloured or hidden.
  'const ok8 = "outline-offset-[-2px]";',
  'const ok9 = "has-[:focus-visible]:translate-y-1";',
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
    "components/calendar/CalendarMonth/CalendarMonth.tsx",
    "components/calendar/CalendarSubscribePanel/CalendarSubscribePanel.tsx",
    "components/search/SearchRelated.tsx",
    "components/organigram/HubSearch/HubSearch.tsx",
    "components/article/NewsCard/NewsCard.tsx",
  ])("does not apply to the inset-ring surface in %s", async (file) => {
    const source =
      'const row = "focus-visible:outline-2 focus-visible:outline-offset-[-2px]";';
    const [result] = await eslint.lintText(source, {
      filePath: join(webDir, "src", file),
    });
    expect(result.messages).toEqual([]);
  });
});
