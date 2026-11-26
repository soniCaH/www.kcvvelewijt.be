/**
 * Proves the `kcvv/no-process-env` selector in `eslint.config.mjs` (#3879)
 * fires: `process.env` is read in `src/lib/env/` only. A selector that fails
 * to parse fails silently, so each violation must be reported and each
 * allowed form must not be.
 */
import { join } from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { eslintForRule, lintFixtures, webDir } from "./eslint-rule-harness";

const eslint = eslintForRule("kcvv/no-process-env");

const VIOLATIONS = [
  "const a = process.env.KCVV_API_URL;",
  'const a = process.env["KCVV_API_URL"];',
  "const a = process.env.KCVV_API_URL?.trim();",
  "const env = process.env;",
  "const { NODE_ENV } = process.env;",
  'const a = process["env"].KCVV_API_URL;',
  "const { env } = process;",
  "const a = globalThis.process.env.KCVV_API_URL;",
  'const a = process.env["NODE_ENV"];',
  'const NODE_ENV = "x"; const a = process.env[NODE_ENV];',
];

const ALLOWED = [
  "const a = readPublicEnv().NODE_ENV;",
  "const env = { process: { env: 1 } }; const a = env.process.env;",
  "const a = processEnv.env;",
  'if (process.env.NODE_ENV === "development") console.warn(1);',
  'const dev = process.env.NODE_ENV !== "production";',
];

const lint = {} as {
  src: Map<string, string[]>;
  envModule: Map<string, string[]>;
  testFile: Map<string, string[]>;
};

// Loading the Next ESLint config takes seconds; pay it here, once, outside
// every test's timeout.
beforeAll(async () => {
  const sources = [...VIOLATIONS, ...ALLOWED];
  const lintAt = (...file: string[]) =>
    lintFixtures(eslint, sources, join(webDir, ...file));
  lint.src = await lintAt("src", "lib", "fixture.ts");
  lint.envModule = await lintAt("src", "lib", "env", "server.ts");
  lint.testFile = await lintAt("src", "lib", "fixture.test.ts");
}, 60_000);

describe("kcvv/no-process-env", () => {
  it.each(VIOLATIONS)("forbids %s in src", (source) => {
    expect(lint.src.get(source)).toEqual([
      expect.stringContaining("No `process.env` outside `src/lib/env/`"),
    ]);
  });

  it.each(ALLOWED)("allows %s", (source) => {
    expect(lint.src.get(source)).toEqual([]);
  });

  it.each(VIOLATIONS)("does not check an env module: %s", (source) => {
    expect(lint.envModule.get(source)).toEqual([]);
  });

  it.each(VIOLATIONS)("does not check a test file: %s", (source) => {
    expect(lint.testFile.get(source)).toEqual([]);
  });
});
