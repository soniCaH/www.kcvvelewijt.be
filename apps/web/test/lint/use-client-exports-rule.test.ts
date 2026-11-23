/**
 * Proves the `kcvv/use-client-exports` rule (`eslint-rules/use-client-exports.mjs`,
 * #3839) fires: a `'use client'` file exports components and types only. A rule
 * that loads but never reports fails silently, so each violation must be
 * reported and each allowed form must not be.
 */
import { join } from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { eslintForRule, lintFixtures, webDir } from "./eslint-rule-harness";

const eslint = eslintForRule("kcvv/use-client-exports");

const CLIENT = '"use client";\n';

const VIOLATIONS = [
  `${CLIENT}export const SIZE = 4;`,
  `${CLIENT}export const getSize = () => 4;`,
  `${CLIENT}export function useThing() { return 1; }`,
  `${CLIENT}export let ready = false;`,
  `${CLIENT}export const { a, b } = value;`,
  `${CLIENT}const helper = 1;\nexport { helper };`,
  `${CLIENT}export * from "./other";`,
  `${CLIENT}export enum Mode { A }`,
  `${CLIENT}export const Card = () => null;\nexport const SIZE = 4;`,
  // A context is a value however it is named.
  `${CLIENT}export const ThingContext = createContext(null);`,
  `${CLIENT}export const ThingContext = React.createContext<string>("a");`,
  `${CLIENT}const ThingContext = createContext(null);\nexport { ThingContext };`,
];

const ALLOWED = [
  `${CLIENT}export const Card = () => null;`,
  `${CLIENT}export function Card() { return null; }`,
  `${CLIENT}export class Card {}`,
  `${CLIENT}export const X = () => null;`,
  `${CLIENT}const ThingContext = createContext(null);\nexport const Card = () => null;`,
  `${CLIENT}export type Props = { a: string };`,
  `${CLIENT}export interface Props { a: string }`,
  `${CLIENT}const Card = () => null;\nexport { Card };`,
  `${CLIENT}type Props = { a: string };\nexport type { Props };`,
  `${CLIENT}export * from "./types";`.replace("export *", "export type *"),
  `${CLIENT}export default function Page() { return null; }`,
  // No directive: any export is fine.
  "export const SIZE = 4;\nexport function useThing() { return 1; }",
  // A directive-looking string that is not the first statement is no directive.
  'const a = 1;\n"use client";\nexport const SIZE = 4;',
];

const fixtures: { messages: Map<string, string[]> } = {
  messages: new Map(),
};

// Loading the Next ESLint config takes seconds; pay it here, once, outside
// every test's timeout.
beforeAll(async () => {
  fixtures.messages = await lintFixtures(
    eslint,
    [...VIOLATIONS, ...ALLOWED],
    join(webDir, "src", "fixture.tsx"),
  );
}, 60_000);

describe("'use client' exports", () => {
  it.each(VIOLATIONS)("forbids a value export: %s", (source) => {
    expect(fixtures.messages.get(source)).toEqual([
      expect.stringContaining("components and types only"),
    ]);
  });

  it.each(ALLOWED)("allows %s", (source) => {
    expect(fixtures.messages.get(source)).toEqual([]);
  });
});
