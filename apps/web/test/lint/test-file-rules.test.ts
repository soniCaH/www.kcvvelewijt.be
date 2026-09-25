/**
 * Proves the test-file `no-restricted-syntax` selectors in `eslint.config.mjs`
 * fire. An esquery selector that fails to parse fails *silently* — the rule
 * loads, `lint` exits 0, and nothing is checked — so each selector needs a
 * violation that must be reported, and a correct form that must not be.
 */
import { join } from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { eslintForRule, lintFixtures, webDir } from "./eslint-rule-harness";

const eslint = eslintForRule("no-restricted-syntax");

const WINDOW_SIZE_WRITES = [
  "window.innerWidth = 500;",
  "window.innerHeight = 800;",
  "globalThis.innerWidth = 500;",
  'window["innerWidth"] = 500;',
  "innerWidth = 500;",
  "window.innerWidth++;",
  "--innerHeight;",
  'Object.defineProperty(window, "innerWidth", { value: 500 });',
  'vi.stubGlobal("innerWidth", 500);',
  'vi.spyOn(window, "innerWidth", "get").mockReturnValue(500);',
];
const FIXED_PORTS = [
  "server.listen(8890);",
  "server.listen(8890 + n);",
  "server.listen({ port: 8890 });",
];
const IN_BODY_IMPORTS = [
  'it("renders", async () => { await import("./page"); });',
];
const ALLOWED = [
  "window.happyDOM.setViewport({ width: 500 }); const w = window.innerWidth;",
  "const size = { innerWidth: 0 }; size.innerWidth = 5;",
  "server.listen(0);",
  'const page = import("./page");',
];

let messages: Map<string, string[]>;

// Loading the Next ESLint config takes seconds; pay it here, once, outside
// every test's timeout.
beforeAll(async () => {
  messages = await lintFixtures(
    eslint,
    [...WINDOW_SIZE_WRITES, ...FIXED_PORTS, ...IN_BODY_IMPORTS, ...ALLOWED],
    join(webDir, "src", "fixture.test.ts"),
  );
}, 60_000);

describe("test-file restricted-syntax rules", () => {
  it.each(WINDOW_SIZE_WRITES)("forbids a window-size write: %s", (source) => {
    expect(messages.get(source)).toEqual([
      expect.stringContaining("setViewport"),
    ]);
  });

  it.each(FIXED_PORTS)("forbids a fixed TCP port: %s", (source) => {
    expect(messages.get(source)).toEqual([
      expect.stringContaining("fixed TCP port"),
    ]);
  });

  it.each(IN_BODY_IMPORTS)("forbids an in-body route import: %s", (source) => {
    expect(messages.get(source)).toEqual([expect.stringContaining("Hoist")]);
  });

  it.each(ALLOWED)("allows %s", (source) => {
    expect(messages.get(source)).toEqual([]);
  });
});
