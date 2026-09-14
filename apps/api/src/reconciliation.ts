import { Effect } from "effect";

/**
 * Shared orphan-reconciliation guard (#2854), consolidating the four-step
 * pattern both `sync/psd-sanity-sync.ts` and `search/sanity-index-sync.ts`
 * grew independently: diff the tracked set against the current set, handle
 * the none-case, apply a ratio-based safety cap before acting, then act.
 *
 * The two callers' denominators are identical (both divide the orphan count
 * by the size of the "active"/reference set), so the semantics match, not
 * just the shape — that's what makes one helper correct for both.
 *
 * `remove` is a plain callback, not an injected service/port (#2167 removed
 * that seam deliberately) — callers pass the concrete archive/delete
 * function directly, same as `reconcileEntity` already did.
 */

export type ReconcileOrphansResult =
  | {
      readonly action: "removed";
      readonly requestedIds: readonly string[];
      readonly confirmedIds: readonly string[];
    }
  | {
      readonly action: "skipped";
      readonly orphanCount: number;
      readonly activeCount: number;
      readonly ratio: number;
    }
  | { readonly action: "none" };

/**
 * Compare `activeIds` (the current/stored set being checked) against
 * `accumulatedIds` (the freshly-known-good set) and remove whatever is in
 * the former but not the latter — unless doing so would exceed a
 * ratio-based safety cap, which guards against a truncated or regressed
 * fetch looking identical to a genuine bulk removal.
 *
 * The cap is `max(floor, activeIds.length * ratioThreshold)`, evaluated
 * against the raw orphan count (not scaled to a bare ratio) — this is the
 * `max(FLOOR, fraction)` shape `search/sanity-index-sync.ts` settled on: a
 * fraction alone latches forever on a small set, because once it trips, the
 * same input recomputes the same refusal every run with no release lever.
 *
 * `floor` defaults to 0 — this is the compatibility guarantee for
 * `sync/psd-sanity-sync.ts`'s three production callers, which never passed
 * a floor before this helper existed and must reproduce their exact
 * pre-refactor behaviour (a bare ratio check) unless they opt in.
 *
 * `ratioThreshold` left `undefined` means "no cap" — orphans are always
 * removed (subject only to the none-case below). Both current callers
 * always pass an explicit threshold; the default only matters for a future
 * caller that doesn't need a cap at all.
 *
 * Returns the **confirmed** removed subset — whatever `remove` reports —
 * not merely a completion signal. A caller whose delete can fail after
 * retries (Vectorize's `deleteByIds`, batched) must know exactly what
 * landed to keep its own bookkeeping (a manifest, a checkpoint) honest.
 */
export const reconcileOrphans = <E>(
  label: string,
  activeIds: readonly string[],
  accumulatedIds: ReadonlySet<string>,
  remove: (ids: string[]) => Effect.Effect<readonly string[], E>,
  ratioThreshold?: number,
  floor = 0,
): Effect.Effect<ReconcileOrphansResult, E> =>
  Effect.gen(function* () {
    const orphanIds = activeIds.filter((id) => !accumulatedIds.has(id));

    if (orphanIds.length === 0) {
      yield* Effect.log(`reconciliation: no orphan ${label} found`);
      return { action: "none" } as const;
    }

    const activeCount = activeIds.length;
    const ratio = orphanIds.length / activeCount;
    const cap =
      ratioThreshold === undefined
        ? undefined
        : Math.max(floor, activeCount * ratioThreshold);

    if (cap !== undefined && orphanIds.length > cap) {
      yield* Effect.log(
        `reconciliation: SKIPPED — ${orphanIds.length}/${activeCount} ${label} would be removed (${Math.round(ratio * 100)}%), exceeds safety cap max(${floor}, ${activeCount} × ${ratioThreshold}). This does not self-heal — the same input recomputes the same refusal every run; see apps/api/CLAUDE.md ("Releasing a stuck prune safety cap") for the release lever once a genuine removal has been confirmed.`,
      );
      return {
        action: "skipped",
        orphanCount: orphanIds.length,
        activeCount,
        ratio,
      } as const;
    }

    const confirmedIds = yield* remove(orphanIds);
    yield* Effect.log(
      `reconciliation: removed ${confirmedIds.length}/${orphanIds.length} ${label}: ${orphanIds.join(", ")}`,
    );
    return {
      action: "removed",
      requestedIds: orphanIds,
      confirmedIds,
    } as const;
  });
