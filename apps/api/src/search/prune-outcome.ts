/**
 * Maps `runSanityIndexSync`'s resolved `PrunePhaseOutcome` to a
 * `search-index-prune` job-alert outcome (#2855).
 *
 * Lives in its own module, separate from `index.ts`, specifically so it can
 * be unit-tested from Node/vitest: `index.ts` re-exports `PsdGate`
 * (`psd/gate-do.ts`), which imports `cloudflare:workers` and — per that
 * module's own doc comment — must never be imported by code the Node test
 * suite loads. Keeping the mapping here means the inversion, the "report
 * nothing" guard, and the job-outcome shape all have direct coverage
 * (`prune-outcome.test.ts`) without pulling `cloudflare:workers` into the
 * Node test process.
 */
import type { PrunePhaseOutcome } from "./sanity-index-sync";

export type JobOutcome =
  { readonly ok: true } | { readonly ok: false; readonly error: unknown };

/**
 * `null` means "report nothing this invocation" (#2855 review, finding 1):
 *
 * - `phase === undefined` — the sweep failed outright (never reached its
 *   `return`). `"sanity-index-sync"`'s own failure report already covers
 *   that; whether the prune step even ran is unknown.
 * - `phase.kind === "not-run"` — reconciliation was skipped wholesale this
 *   sweep (a degraded fetch or a failed manifest read). This proves
 *   nothing about whether a prior cap refusal released — reporting
 *   `ok: true` here would fire a false recovery ping while the cap stays
 *   latched (the Sanity-503 class the owner decision cited, 2026-09-18 run
 *   35318911017).
 *
 * `"refused"` and `"zero-confirmed"` both map to `ok: false` — a cap
 * refusal and a prune that ran but had every delete rejected by Vectorize
 * are both "the index still holds ids it shouldn't", just with different
 * causes. Only `"ok"` (nothing to prune, or a prune that landed) is
 * healthy.
 */
export function pruneJobOutcome(
  phase: PrunePhaseOutcome | undefined,
): JobOutcome | null {
  if (phase === undefined || phase.kind === "not-run") return null;
  if (phase.kind === "ok") return { ok: true };
  if (phase.kind === "refused") {
    return {
      ok: false,
      error: new Error(
        `search-index-prune: refused — ${phase.orphanCount}/${phase.activeCount} orphaned (${Math.round(phase.ratio * 100)}%) exceeds the safety cap`,
      ),
    };
  }
  // "zero-confirmed"
  return {
    ok: false,
    error: new Error(
      `search-index-prune: ran but confirmed 0/${phase.requestedCount} deletes — Vectorize rejected every delete`,
    ),
  };
}
