import { describe, it, expect, vi, afterEach } from "vitest";
import { Data, Effect, Runtime } from "effect";
import { notFound, redirect } from "next/navigation";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { SanityReadError } from "@/lib/sanity/fetch-groq";
import { runPromise } from "./runtime";

const { DYNAMIC_BAILOUT, connection } = vi.hoisted(() => {
  const DYNAMIC_BAILOUT = new Error("connection() bailout");
  return {
    DYNAMIC_BAILOUT,
    connection: vi.fn(async () => {
      throw DYNAMIC_BAILOUT;
    }),
  };
});
vi.mock("next/server", () => ({ connection }));

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

  it("preserves redirect()'s digest the same way (only notFound()/redirect() are pinned here — see runtime.ts's docblock)", async () => {
    const effect = Effect.fail({ _tag: "HttpNotFound" as const }).pipe(
      Effect.catchTag("HttpNotFound", () =>
        Effect.sync(() => redirect("/ploegen")),
      ),
    );

    const rejection = await runPromise(effect).then(
      () => {
        throw new Error("expected runPromise to reject");
      },
      (error: unknown) => error,
    );

    expect(Runtime.isFiberFailure(rejection)).toBe(false);
    expect(rejection).toMatchObject({
      digest: expect.stringMatching(/^NEXT_REDIRECT;/),
    });
  });

  // Data.TaggedError, not a plain object: every real defect in this app
  // (SanityReadError, HttpClientError.RequestError) is an `Error` subclass,
  // so `unstable_rethrow`'s `error instanceof Error && 'cause' in error`
  // branch is what actually runs against a real failure. A plain
  // `{ _tag: ... }` object fails that `instanceof Error` check immediately
  // and never reaches the cause-walk this suite (and runtime.ts's docblock)
  // is about — review finding 3 on #3034.
  class GenuineFailureWithCause extends Data.TaggedError(
    "GenuineFailureWithCause",
  )<{ readonly cause: unknown }> {}

  it("still wraps a genuine (non-control-flow) failure as a FiberFailure, unchanged — even one shaped like SanityReadError (an Error subclass with its own .cause)", async () => {
    const effect = Effect.fail(
      new GenuineFailureWithCause({
        cause: new Error("Sanity is unreachable"),
      }),
    ).pipe(Effect.orDie);

    const rejection = await runPromise(effect).then(
      () => {
        throw new Error("expected runPromise to reject");
      },
      (error: unknown) => error,
    );

    // Existing classification helpers (`isPermanentBffFailure`, this file's
    // sibling test suites) all key off `Runtime.isFiberFailure` — a real bug
    // must keep surfacing that way so those keep working and the route's
    // error boundary (500) still fires for a genuine failure. The cause
    // chain *was* walked (this error shape guarantees it) — it simply never
    // bottomed out on one of Next's own signals, so nothing was rethrown.
    expect(Runtime.isFiberFailure(rejection)).toBe(true);
  });

  it("reclassifies a genuine error that WRAPS a notFound() sentinel as its own .cause — unstable_rethrow's documented cause-walk, not narrowed here (#3034 review findings 1/2)", async () => {
    let sentinel: unknown;
    try {
      notFound();
    } catch (error) {
      sentinel = error;
    }

    // Shaped like `SanityReadError` (`lib/sanity/fetch-groq.ts`): a genuine
    // failure whose `.cause` happens to be one of Next's own sentinels.
    // Nothing in this repo constructs this deliberately today — this pins
    // `unstable_rethrow`'s actual behaviour so a future change that DID
    // start nesting a sentinel this way would not go unnoticed.
    class WrappingFailure extends Data.TaggedError("WrappingFailure")<{
      readonly cause: unknown;
    }> {}

    const effect = Effect.fail(new WrappingFailure({ cause: sentinel })).pipe(
      Effect.orDie,
    );

    const rejection = await runPromise(effect).then(
      () => {
        throw new Error("expected runPromise to reject");
      },
      (error: unknown) => error,
    );

    // The outer `WrappingFailure` is discarded entirely — the sentinel
    // buried in its `.cause` is what actually gets re-thrown.
    expect(Runtime.isFiberFailure(rejection)).toBe(false);
    expect(rejection).toBe(sentinel);
    expect(rejection).toMatchObject({
      digest: expect.stringMatching(/^NEXT_HTTP_ERROR_FALLBACK;404/),
    });
  });
});

/**
 * #3135, flake class H: a prerendered page's content read hit a Sanity 503
 * during `next build` and killed the whole build. At build, a Sanity read
 * defect that reaches `runPromise` calls `connection()` instead, so Next
 * leaves that one page out and serves it on demand until the next deploy.
 */
describe("runPromise during `next build`", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    connection.mockClear();
  });

  const sanityDown = Effect.fail(
    new SanityReadError({ cause: new Error("HTTP 503") }),
  ).pipe(Effect.orDie);

  const rejectionOf = (effect: Effect.Effect<unknown>) =>
    runPromise(effect).then(
      () => {
        throw new Error("expected runPromise to reject");
      },
      (error: unknown) => error,
    );

  it("turns a Sanity read defect into Next's on-demand bailout", async () => {
    vi.stubEnv("NEXT_PHASE", PHASE_PRODUCTION_BUILD);
    expect(await rejectionOf(sanityDown)).toBe(DYNAMIC_BAILOUT);
    expect(connection).toHaveBeenCalledOnce();
  });

  it("leaves a code defect alone — a red build still means the code is wrong", async () => {
    vi.stubEnv("NEXT_PHASE", PHASE_PRODUCTION_BUILD);
    const rejection = await rejectionOf(
      Effect.die(new TypeError("x is undefined")),
    );
    expect(Runtime.isFiberFailure(rejection)).toBe(true);
    expect(connection).not.toHaveBeenCalled();
  });

  it("leaves a Sanity read defect alone outside the build", async () => {
    vi.stubEnv("NEXT_PHASE", "");
    expect(Runtime.isFiberFailure(await rejectionOf(sanityDown))).toBe(true);
    expect(connection).not.toHaveBeenCalled();
  });
});
