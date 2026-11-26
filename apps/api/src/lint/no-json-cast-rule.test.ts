/**
 * Proves the `kcvv/no-json-cast` selectors in `eslint.config.mjs` (#3877)
 * fire: `JSON.parse(x) as T` and `(await r.json()) as T` trust a shape nobody
 * checked. `as unknown` is honest and stays allowed. A selector that fails to
 * parse fails silently, so each violation must be reported and each allowed
 * form must not be.
 */
import { join } from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { apiDir, eslintForRule, lintFixtures } from "./eslint-rule-harness";

const eslint = eslintForRule("kcvv/no-json-cast");

const VIOLATIONS = [
  "const a = JSON.parse(text) as Foo;",
  "const a = JSON.parse(text) as { name?: unknown };",
  "const a = JSON.parse(text) as Record<string, string>;",
  "const a = (await response.json()) as Foo;",
  "const a = (await response.json().catch(() => null)) as Foo | null;",
  "const a = (await (await fetch(url)).json()) as Foo;",
  "const f = () => JSON.parse(cached) as Foo;",
  "const f = () => Effect.try({ try: () => JSON.parse(cached) as Foo, catch: () => null });",
];

const ALLOWED = [
  "const a = JSON.parse(text) as unknown;",
  "const a: unknown = JSON.parse(text);",
  "const a = (await response.json()) as unknown;",
  "const a = (await response.json().catch(() => null)) as unknown;",
  "const a = decode(JSON.parse(text));",
  "const a = await response.json();",
  "const a = S.decodeUnknownOption(S.parseJson(Foo))(text);",
  "const a = (await response.text()) as Foo;",
  "const a = (await response.blob()) as Foo;",
  "const a = JSON.stringify(foo) as Foo;",
  "const a = Foo.parse(text) as Foo;",
  "const a = value as Foo;",
];

const lint = {} as {
  src: Map<string, string[]>;
  testFile: Map<string, string[]>;
};

beforeAll(async () => {
  const sources = [...VIOLATIONS, ...ALLOWED];
  lint.src = await lintFixtures(
    eslint,
    sources,
    join(apiDir, "src", "fixture.ts"),
  );
  lint.testFile = await lintFixtures(
    eslint,
    sources,
    join(apiDir, "src", "fixture.test.ts"),
  );
}, 60_000);

describe("kcvv/no-json-cast", () => {
  it.each(VIOLATIONS)("forbids %s", (source) => {
    expect(lint.src.get(source)).toEqual([
      expect.stringContaining("S.parseJson(schema)"),
    ]);
  });

  it.each(VIOLATIONS)("covers a test file too: %s", (source) => {
    expect(lint.testFile.get(source)).toHaveLength(1);
  });

  it.each(ALLOWED)("allows %s", (source) => {
    expect(lint.src.get(source)).toEqual([]);
  });
});
