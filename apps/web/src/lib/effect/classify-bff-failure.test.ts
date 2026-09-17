import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { isPermanentBffFailure } from "./classify-bff-failure";
import { makeTaggedBffError } from "./bff-error.fixtures";
import type { BffError } from "@/lib/effect/services/BffService";

// Typed against the real `BffError["_tag"]` union (not a bare `string`), so
// a tag renamed or removed on `BffError` fails THIS file to compile too —
// the review finding this fixes: the previous version built its own
// `class Tagged { _tag = tag }` from hand-written strings, asserting
// `PERMANENT_TAGS` against strings the test itself supplied, which could
// never catch drift between the two (#2636 finding 2). Its transient case
// also asserted a tag, `"HttpClientError"`, that does not exist —
// `HttpClientError` is a *type alias* for `RequestError | ResponseError`
// (`@effect/platform`'s `HttpClientError.ts`), neither of which carries that
// string as its own `_tag`.
/**
 * Piped through `Effect.orDie`, matching the shape `getTeamMatches`
 * (`lib/server/match-data.ts`) actually produces since #2864: the BFF
 * effect's typed failure is converted to a defect before `runPromise`, so a
 * rejection always carries a `Die` cause here, never a `Fail` one.
 * `Cause.squash` (what `isPermanentBffFailure` uses) unwraps either shape to
 * the same tagged value — verified empirically — but a test that only
 * exercised `Effect.fail` would stay green through a future refactor to a
 * `Fail`-only extractor (e.g. `Cause.failureOption`) that silently broke
 * this classification against production's real `Die`-shaped rejection.
 */
async function runAndCatch(tag: BffError["_tag"]): Promise<unknown> {
  try {
    await Effect.runPromise(
      Effect.fail(makeTaggedBffError(tag)).pipe(Effect.orDie),
    );
  } catch (error) {
    return error;
  }
  throw new Error("expected Effect.runPromise to reject");
}

describe("isPermanentBffFailure", () => {
  it.each<BffError["_tag"]>([
    "HttpNotFound",
    "ParseError",
    "HttpApiDecodeError",
  ])("reads %s as permanent", async (tag) => {
    expect(isPermanentBffFailure(await runAndCatch(tag))).toBe(true);
  });

  it.each<BffError["_tag"]>([
    "HttpServiceUnavailable",
    "HttpBadGateway",
    "TimeoutException",
    "RequestError",
    "ResponseError",
  ])("reads %s as transient, not permanent", async (tag) => {
    expect(isPermanentBffFailure(await runAndCatch(tag))).toBe(false);
  });

  it("reads a non-FiberFailure value as not permanent (fails open to throw)", () => {
    expect(isPermanentBffFailure(new TypeError("network down"))).toBe(false);
    expect(isPermanentBffFailure("a plain string throw")).toBe(false);
    expect(isPermanentBffFailure(undefined)).toBe(false);
  });
});
