import { Effect } from "effect";

/**
 * Degrade a failed **section** read to a fallback, and say so in the logs.
 *
 * #2433 rule 3 splits a failed read by what it was: the page's **subject**
 * takes the page down to the one global boundary, a **section** keeps the page.
 * This is the section half — the subject half is a bare read with no handler at
 * all, which is the whole point of not having a `degradePage` next to this.
 *
 * **Why `catchAllCause` and not `catchAll`.** A Sanity read's own failure is
 * now a typed `SanityReadError` (`lib/sanity/fetch-groq.ts`, #2864) that
 * `catchAll` would catch — but `catchAllCause` also catches a genuine defect
 * (an unexpected throw elsewhere in the same `Effect.gen`), which `catchAll`
 * would let crash the page regardless. One spelling covers both, so it lives
 * here under a name rather than being re-derived per call site.
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
 * `degradeSection`, always falling back to `READ_FAILED`. `E` is generic,
 * same as `degradeSection` above — a Sanity read's `SanityReadError`
 * (`lib/sanity/fetch-groq.ts`) included, since #2864 gave it a typed error
 * channel. Not a substitute for a BFF call's own `Effect.catchAll`/
 * `Effect.catchTags` — those classify permanent vs. transient first.
 */
export const degradeSectionFlagged = <A, E, R>(
  self: Effect.Effect<A, E, R>,
  note: string,
): Effect.Effect<A | typeof READ_FAILED, never, R> =>
  degradeSection<A | typeof READ_FAILED, E, R>(self, READ_FAILED, note);
