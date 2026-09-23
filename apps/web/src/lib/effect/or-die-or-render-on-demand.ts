import { Effect } from "effect";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { connection } from "next/server";
import type { SanityReadError } from "@/lib/sanity/fetch-groq";

/**
 * `Effect.orDie` for the subject read of a page with no slug — except during
 * `next build`, where a failed read leaves the page out of the build instead
 * of killing it (#3135, flake class H).
 *
 * A slug route stays off the live network at build by returning `[]` from
 * `generateStaticParams` (`isr-route-config.test.ts`). A page with no slug is
 * always prerendered, so its read runs against live Sanity, and one 503 there
 * fails the whole build. At build time `connection()` throws Next's own
 * dynamic-usage signal, which `runPromise` restores through
 * `unstable_rethrow` (#3034): Next skips the page and serves it rendered on
 * demand, uncached, until the next deploy prerenders it again. Nothing
 * degraded is ever written to the ISR cache.
 *
 * Only a `SanityReadError` takes that exit. A defect — a code bug — still
 * dies, so a red build still means the code is wrong. Outside the build this
 * is plain `Effect.orDie`: a runtime failure throws and ISR keeps serving the
 * last good page (#2433 rule 2/3).
 */
export const orDieOrRenderOnDemand = <A, R>(
  self: Effect.Effect<A, SanityReadError, R>,
): Effect.Effect<A, never, R> =>
  self.pipe(
    Effect.catchAll((error) =>
      process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD
        ? Effect.promise(() => connection()).pipe(
            Effect.zipRight(Effect.die(error)),
          )
        : Effect.die(error),
    ),
  );
