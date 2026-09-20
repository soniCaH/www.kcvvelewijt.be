import { Runtime, Cause } from "effect";
import type { BffError } from "@/lib/effect/services/BffService";

/**
 * Tags that mean "this will not resolve itself on the next retry" — a
 * mistyped or stale `psdId` in Sanity (`HttpNotFound`), or a response PSD
 * sent that no longer matches this deploy's decoded shape (`ParseError`,
 * `HttpApiDecodeError`). Every other `BffError` tag — a timeout, a 502/503,
 * a generic client/network error — is a transient blip: retried by the next
 * ISR regeneration, which is exactly what letting it throw is for.
 *
 * **The single source of truth for this split.** `isPermanentBffFailure`
 * below and `degradeIfPermanent` (`lib/effect/degrade-if-permanent.ts`) both
 * build off this list rather than hand-typing their own copy of the same
 * three tags. `/ploegen/[slug]/page.tsx`'s `fetchBffData` relies on both
 * classifying identically for its two BFF reads — a fourth tag added to only
 * one hand-typed copy would silently disagree between them, with no compiler
 * or test signal (#2778 review finding 1).
 *
 * Typed `as const satisfies readonly BffError["_tag"][]`, not a bare
 * `string[]`: renaming or removing a tag on `BffError`
 * (`lib/effect/services/BffService.ts`) then fails to compile here instead of
 * silently narrowing this list to nothing — every permanent failure would
 * reclassify as transient, and `page.tsx`'s competitive block would revert to
 * the exact `error.tsx`-forever bug this module exists to fix, with no red
 * test (#2636 finding 2).
 *
 * This is genuinely the matches read's own tool now — `page.tsx`'s ranking
 * read has its typed `BffError` channel at the call site, so it classifies a
 * permanent tag with `degradeIfPermanent`/`Effect.catchTags` directly, before
 * it ever becomes a rejected promise. The matches read goes through
 * `getTeamMatches` (`lib/server/match-data.ts`), whose channel is already
 * flattened to a rejecting `Promise` by the #2441 dedupe, so it cannot do
 * the same — `isPermanentBffFailure` is what is left to classify it after
 * the fact.
 */
export const PERMANENT_BFF_TAGS = [
  "HttpNotFound",
  "ParseError",
  "HttpApiDecodeError",
] as const satisfies readonly BffError["_tag"][];

/** The literal union of `PERMANENT_BFF_TAGS` — the tags `degradeIfPermanent` catches. */
export type PermanentBffTag = (typeof PERMANENT_BFF_TAGS)[number];

const PERMANENT_TAGS: ReadonlySet<BffError["_tag"]> = new Set(
  PERMANENT_BFF_TAGS,
);

/**
 * Unwraps a rejected `Effect.runPromise`'s `FiberFailure` back to the value
 * `Cause.squash` produces off it — the one shared three-step unwrap
 * (`Runtime.isFiberFailure` guard, `Runtime.FiberFailureCauseId` symbol,
 * `Cause.squash`) every consumer that needs to inspect *what* a rejection
 * actually was needs. Returns `undefined` for anything that is not a
 * `FiberFailure` at all (defensive: a plain `TypeError`, a value thrown by
 * non-Effect code) rather than throwing, so callers can treat "not a
 * FiberFailure" as their own not-applicable case.
 *
 * Generic — not BFF-specific — but lives here because `isPermanentBffFailure`
 * below was this repo's first consumer of the unwrap. `runtime.ts`'s
 * `runPromise` is the second (#3034); two independent hand-copies of the same
 * three-step unwrap is exactly the peer-drift root `CLAUDE.md` warns about —
 * the next person to touch one would silently not touch the other.
 */
export function squashFiberFailure(error: unknown): unknown {
  return Runtime.isFiberFailure(error)
    ? Cause.squash(error[Runtime.FiberFailureCauseId])
    : undefined;
}

/**
 * True when a value caught from a rejected `Effect.runPromise` carries one of
 * `PERMANENT_BFF_TAGS`.
 *
 * A value that is not a `FiberFailure` at all (`squashFiberFailure` returns
 * `undefined`) reads as **not** permanent, so it still throws and gets the
 * ISR-fallback treatment rather than silently degrading on a shape this
 * function does not recognise.
 *
 * @see https://github.com/soniCaH/www.kcvvelewijt.be/issues/2636 — finding 3
 */
export function isPermanentBffFailure(error: unknown): boolean {
  const squashed = squashFiberFailure(error);
  if (squashed === undefined) return false;
  const tag = (squashed as { _tag?: unknown })?._tag;
  return typeof tag === "string" && PERMANENT_TAGS.has(tag as BffError["_tag"]);
}
