/**
 * Proves the `OFF_RAMP_FONT_SIZE_PATTERN` `no-restricted-syntax` selector in
 * `eslint.config.mjs` (#2418) fires. An esquery selector that fails to parse
 * fails *silently* — the rule loads, `lint` exits 0, and nothing is checked —
 * so this needs a violation that must be reported, and both a token class and
 * an out-of-scope literal (`leading-[…]`, owned by #2666) that must not be.
 */
import { join } from "node:path";

import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

const webDir = join(import.meta.dirname, "..", "..");
const eslint = new ESLint({
  cwd: webDir,
  ruleFilter: ({ ruleId }) => ruleId === "no-restricted-syntax",
});

const OFF_RAMP_LITERALS = [
  'const a = "text-[9px]";',
  'const b = "text-[10.5px]";',
  'const c = "text-[1.05rem]";',
  'const d = "text-[0.4em]";',
  'const e = "text-[length:var(--text-display-lg)]";',
  "const f = `text-[9px]`;",
];
const ALLOWED = [
  'const ok = "text-label";',
  // Out of scope by name — line-height literals belong to #2666, not this rule.
  'const ok2 = "leading-[1.2]";',
  // A different bracket utility entirely; must not be swept up by "text-[".
  'const ok3 = "w-[10px]";',
];

const messages = new Map<string, string[]>();

// Loading the Next ESLint config takes seconds; pay it here, once, outside
// every test's timeout.
beforeAll(async () => {
  const sources = [...OFF_RAMP_LITERALS, ...ALLOWED];
  const results = await Promise.all(
    sources.map((source) =>
      eslint.lintText(source, {
        filePath: join(webDir, "src", "fixture.tsx"),
      }),
    ),
  );
  sources.forEach((source, i) =>
    messages.set(
      source,
      results[i][0].messages.map((message) => message.message),
    ),
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
