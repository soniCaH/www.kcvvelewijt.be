/**
 * Shared harness for the `src/lint/*.test.ts` files: each proves one
 * `no-restricted-syntax`-family selector in `eslint.config.mjs` actually
 * fires, by running ESLint's Node API against fixture source strings. An
 * esquery selector that fails to parse fails *silently* — the rule loads,
 * `lint` exits 0, and nothing is checked — so every one of these needs a
 * violation that must be reported, and a correct form that must not be.
 * Mirrors `apps/web/test/lint/eslint-rule-harness.ts`.
 */
import { join } from "node:path";

import { ESLint } from "eslint";

export const apiDir = join(import.meta.dirname, "..", "..");

/** An ESLint instance scoped to exactly one rule ID, to keep each fixture run fast. */
export const eslintForRule = (ruleId: string) =>
  new ESLint({ cwd: apiDir, ruleFilter: (rule) => rule.ruleId === ruleId });

/** Lints every source once and returns a `source -> messages` lookup for `it.each` blocks. */
export const lintFixtures = async (
  eslint: ESLint,
  sources: string[],
  filePath: string,
): Promise<Map<string, string[]>> => {
  const results = await Promise.all(
    sources.map((source) => eslint.lintText(source, { filePath })),
  );
  return new Map(
    sources.map((source, i) => [
      source,
      (results[i]?.[0]?.messages ?? []).map((message) => message.message),
    ]),
  );
};
