import { Effect } from "effect";
import type { BffError } from "@/lib/effect/services/BffService";
import {
  PERMANENT_BFF_TAGS,
  type PermanentBffTag,
} from "@/lib/effect/classify-bff-failure";

/**
 * Resolve a `BffError`-typed Effect's **permanent** failures to `onPermanent`
 * instead of letting them reject; leave a **transient** failure rejecting
 * unchanged. The tags are `PERMANENT_BFF_TAGS` (`classify-bff-failure.ts`) —
 * the same list `isPermanentBffFailure` treats as permanent, so the two never
 * hand-typed copies can drift apart.
 *
 * This is the pre-rejection sibling of `isPermanentBffFailure`: use this when
 * the read's error channel is still typed as `BffError` at the call site (an
 * `Effect.gen`/`bff.<method>()` chain before `runPromise`), so `Effect.catchTags`
 * can classify and exhaustiveness-check against the union directly. Once a
 * channel is already flattened to a rejecting `Promise` (e.g. by a dedupe
 * layer), it's too late for this — classify the rejection after the fact with
 * `isPermanentBffFailure` instead. `/ploegen/[slug]/page.tsx`'s `fetchBffData`
 * docstring explains why its two BFF reads need one classifier each.
 *
 * Left to reject, a transient failure keeps the throw-for-ISR-fallback shape:
 * `runPromise` rejects, the page throws, and ISR serves the last-good page
 * instead of caching whatever a caught failure would resolve to (#2540 state
 * 4 / #2636 / #2778).
 *
 * A degrade here always logs (`console.warn`, with the tagged error as
 * cause) — unlike `degradeSection` (`lib/effect/degrade.ts`), which takes a
 * caller-supplied `note`, this helper's entire trigger class is failures that
 * need human action (a stale `kcvv_team_id`, contract drift this deploy can't
 * decode), so a single hardcoded message naming the classified tag is enough
 * signal; nothing here is normal enough to stay silent.
 *
 * The returned error channel is narrowed to exclude `PermanentBffTag` — not
 * upcast back to the full `BffError` — so a rejection downstream is
 * genuinely guaranteed transient by the type system, not just by a comment.
 *
 * @see https://github.com/soniCaH/www.kcvvelewijt.be/issues/2778
 */
export const degradeIfPermanent = <A, F, R>(
  effect: Effect.Effect<A, BffError, R>,
  onPermanent: F,
): Effect.Effect<A | F, Exclude<BffError, { _tag: PermanentBffTag }>, R> => {
  const warnAndDegrade = (error: { _tag: PermanentBffTag }) => {
    console.warn(
      `[degradeIfPermanent] "${error._tag}" classified as permanent; degrading instead of retrying.`,
      { error },
    );
    return Effect.succeed(onPermanent);
  };
  const handlers = Object.fromEntries(
    PERMANENT_BFF_TAGS.map((tag) => [tag, warnAndDegrade]),
  ) as Record<PermanentBffTag, typeof warnAndDegrade>;

  return effect.pipe(Effect.catchTags(handlers));
};
