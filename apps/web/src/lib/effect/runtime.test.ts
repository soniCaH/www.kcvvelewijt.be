import { describe, it, expect } from "vitest";
import { Effect, Runtime } from "effect";
import { notFound } from "next/navigation";
import { runPromise } from "./runtime";

/**
 * #3034 root cause: `Effect.runPromise` (and `ManagedRuntime.runPromise`,
 * which `runPromise` here wraps) never rejects with the error a defect threw
 * — it rejects with a brand-new `FiberFailureImpl` that copies only
 * `message`/`name`/`stack` from the underlying `Cause`. `notFound()`'s thrown
 * sentinel carries its HTTP status on a non-standard `.digest` property
 * (`next/dist/client/components/http-access-fallback` reads it via
 * `isHTTPAccessFallbackError`), which `FiberFailureImpl` drops on the floor.
 *
 * Every `Effect.catchTag("HttpNotFound", () => Effect.sync(() => notFound()))`
 * call site (`wedstrijd/[matchId]/page.tsx`, `ploegen/[slug]/wedstrijden/page.tsx`)
 * routes through this exact `runPromise`, so the page component's `await`
 * throws the digest-less wrapper instead of `notFound()`'s own error. Next's
 * `app-render.tsx` catch can no longer recognise it as `NEXT_HTTP_ERROR_FALLBACK`
 * and falls through to `res.statusCode = 500` — a real 500 for a route that
 * should 404 (soft or hard).
 */
describe("runPromise", () => {
  it("preserves notFound()'s digest through an Effect.sync throw (#3034)", async () => {
    const effect = Effect.fail({ _tag: "HttpNotFound" as const }).pipe(
      Effect.catchTag("HttpNotFound", () => Effect.sync(() => notFound())),
    );

    const rejection = await runPromise(effect).then(
      () => {
        throw new Error("expected runPromise to reject");
      },
      (error: unknown) => error,
    );

    // Not a FiberFailure any more for this one case — Next's own sentinel,
    // digest intact, is what must reach `app-render.tsx`'s catch.
    expect(Runtime.isFiberFailure(rejection)).toBe(false);
    expect(rejection).toMatchObject({
      digest: expect.stringMatching(/^NEXT_HTTP_ERROR_FALLBACK;404/),
    });
  });

  it("still wraps a genuine (non-control-flow) failure as a FiberFailure, unchanged", async () => {
    const effect = Effect.fail({ _tag: "HttpBadGateway" as const }).pipe(
      Effect.orDie,
    );

    const rejection = await runPromise(effect).then(
      () => {
        throw new Error("expected runPromise to reject");
      },
      (error: unknown) => error,
    );

    // Existing classification helpers (`isPermanentBffFailure`, this file's
    // sibling test suites) all key off `Runtime.isFiberFailure` — a real bug
    // must keep surfacing that way so those keep working and the route's
    // error boundary (500) still fires for a genuine failure.
    expect(Runtime.isFiberFailure(rejection)).toBe(true);
  });
});
