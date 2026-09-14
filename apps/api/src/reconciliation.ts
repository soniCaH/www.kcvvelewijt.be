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

export interface ReconcileOrphansConfig {
  /** `max(floor, activeIds.length * ratioThreshold)` caps the orphan count
   * this call will act on. Omit to never cap (orphans are always removed,
   * subject only to the none-case). */
  readonly ratioThreshold?: number;
  /** Absolute floor for the cap above. Defaults to 0 — this is the
   * compatibility guarantee for `sync/psd-sanity-sync.ts`'s three
   * production callers, which never passed a floor before this helper
   * existed and must reproduce their exact pre-refactor behaviour (a bare
   * ratio check) unless they opt in. */
  readonly floor?: number;
  /** Prepended to every log line this call emits (e.g. `"[search-sync] "`)
   * so a log query scoped to a caller's own prefix still finds its
   * reconciliation outcome, refusal included. Defaults to `""`. */
  readonly logPrefix?: string;
  /**
   * Where an operator finds THIS caller's release lever once a cap
   * refusal has been investigated and confirmed genuine. Required — not
   * defaulted — because the two current callers have different levers
   * (search-index deletes a KV manifest key; PSD sync sets a scoped
   * override key) documented in different `apps/api/CLAUDE.md` sections.
   * A shared default here previously pointed every caller at the
   * search-index-only lever, which would tell an operator investigating a
   * PSD refusal to delete the search-index manifest — wiping unrelated
   * state while leaving the actual refusal untouched (#2854 review).
   */
  readonly releaseLeverHint: string;
}

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
 * Returns the **confirmed** removed subset — whatever `remove` reports —
 * not merely a completion signal. A caller whose delete can fail after
 * retries (Vectorize's `deleteByIds`, batched) must know exactly what
 * landed to keep its own bookkeeping (a manifest, a checkpoint) honest.
 *
 * The "removed" log line reports the CONFIRMED ids, not the requested
 * ones: a caller whose `remove` is a dry run (returns `[]` without acting)
 * gets `confirmed 0/N … removed` with no id list, not a line that reads as
 * if a prune happened and repeats the same ids its own dry-run log already
 * printed.
 */
export const reconcileOrphans = <E>(
  label: string,
  activeIds: readonly string[],
  accumulatedIds: ReadonlySet<string>,
  remove: (ids: string[]) => Effect.Effect<readonly string[], E>,
  config: ReconcileOrphansConfig,
): Effect.Effect<ReconcileOrphansResult, E> =>
  Effect.gen(function* () {
    const {
      ratioThreshold,
      floor = 0,
      logPrefix = "",
      releaseLeverHint,
    } = config;
    const orphanIds = activeIds.filter((id) => !accumulatedIds.has(id));

    if (orphanIds.length === 0) {
      yield* Effect.log(`${logPrefix}reconciliation: no orphan ${label} found`);
      return { action: "none" } as const;
    }

    const activeCount = activeIds.length;
    const ratio = orphanIds.length / activeCount;
    const cap =
      ratioThreshold === undefined
        ? undefined
        : Math.max(floor, activeCount * ratioThreshold);

    if (cap !== undefined && orphanIds.length > cap) {
      yield* Effect.logWarning(
        `${logPrefix}reconciliation: SKIPPED — ${orphanIds.length}/${activeCount} ${label} would be removed (${Math.round(ratio * 100)}%), exceeds safety cap max(${floor}, ${activeCount} × ${ratioThreshold}). This does not self-heal — the same input recomputes the same refusal every run; ${releaseLeverHint}`,
      );
      return {
        action: "skipped",
        orphanCount: orphanIds.length,
        activeCount,
        ratio,
      } as const;
    }

    const confirmedIds = yield* remove(orphanIds);
    const confirmedList =
      confirmedIds.length > 0 ? `: ${confirmedIds.join(", ")}` : "";
    yield* Effect.log(
      `${logPrefix}reconciliation: confirmed ${confirmedIds.length}/${orphanIds.length} ${label} removed${confirmedList}`,
    );
    return {
      action: "removed",
      requestedIds: orphanIds,
      confirmedIds,
    } as const;
  });
