import type { BffError } from "@/lib/effect/services/BffService";

/**
 * A minimal object carrying a real `BffError["_tag"]` and nothing else,
 * usable as `Effect.fail`'s payload. Typed against the real tag union (not a
 * bare `string`) so a tag renamed or removed on `BffError`
 * (`lib/effect/services/BffService.ts`) fails a test file importing this to
 * compile instead of silently narrowing which tags it covers.
 *
 * Shared by `classify-bff-failure.test.ts` and `degrade-if-permanent.test.ts`
 * — both exercise the same tag union against sibling classifiers, so their
 * fixture shouldn't be two hand-copies of the same two-line class.
 */
export const makeTaggedBffError = (
  tag: BffError["_tag"],
): {
  readonly _tag: BffError["_tag"];
  readonly message: string;
} => {
  return { _tag: tag, message: "boom" };
};
