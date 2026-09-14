import { Effect } from "effect";

/**
 * Degrade a failed **section** read to a fallback, and say so in the logs.
 *
 * #2433 rule 3 splits a failed read by what it was: the page's **subject**
 * takes the page down to the one global boundary, a **section** keeps the page.
 * This is the section half — the subject half is a bare read with no handler at
 * all, which is the whole point of not having a `degradePage` next to this.
 *
 * **Why `catchAllCause` and not `catchAll`.** Every Sanity read ends in
 * `Effect.orDie` (`lib/sanity/fetch-groq.ts`), so a repository method is typed
 * `Effect<A>` — `E = never` — and its failures arrive as *defects*. An
 * `Effect.catchAll` on one type-checks, reads like a guard, and never runs. The
 * site had eight of those before #2563 and the compiler flagged none of them,
 * which is why the correct spelling lives here under a name rather than being
 * re-derived per call site.
 *
 * `note` is logged with the cause because these are defects: a section that
 * quietly disappears may be a Sanity blip, or may be a broken GROQ projection
 * that would otherwise never surface anywhere.
 *
 * @see https://github.com/soniCaH/www.kcvvelewijt.be/issues/2563
 */
export const degradeSection = <A, E, R>(
  self: Effect.Effect<A, E, R>,
  fallback: A,
  note: string,
): Effect.Effect<A, never, R> =>
  self.pipe(
    Effect.catchAllCause((cause) => {
      console.warn(note, { cause });
      return Effect.succeed(fallback);
    }),
  );

/**
 * A `degradeSection` fallback no legitimate read can ever produce — for a
 * read whose success type already spends a value (typically `null`) on
 * "genuinely nothing", so a plain `degradeSection` fallback of that same
 * value would make a failed read indistinguishable from a genuinely empty
 * one at the call site (#2944). `unique symbol` — no `A` can equal it.
 */
export const READ_FAILED: unique symbol = Symbol("READ_FAILED");

/**
 * `degradeSection`, always falling back to `READ_FAILED`. Same `E = never`
 * restriction as `degradeSection` above — Sanity reads (`Effect.orDie`
 * defects) only, not a general error-channel handler; a read with a real
 * error channel (e.g. a BFF call) should keep its own `Effect.catchAll`.
 */
export const degradeSectionFlagged = <A, R>(
  self: Effect.Effect<A, never, R>,
  note: string,
): Effect.Effect<A | typeof READ_FAILED, never, R> =>
  degradeSection<A | typeof READ_FAILED, never, R>(self, READ_FAILED, note);
