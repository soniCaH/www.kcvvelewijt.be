/**
 * Maps `runSync`'s resolved `CleanupOutcome` to a `psd-sanity-sync-cleanup`
 * job-alert outcome (#3564).
 *
 * Own module, separate from `index.ts`, for the same reason as
 * `search/prune-outcome.ts`: `index.ts` pulls in `cloudflare:workers`, which
 * the Node test suite must never load.
 */
import type { JobOutcome } from "../search/prune-outcome";
import type { CleanupOutcome, CleanupSkip } from "./psd-sanity-sync";

const describeSkip = (skip: CleanupSkip): string => {
  switch (skip.kind) {
    case "cycle-incomplete":
      return `cycle incomplete: team(s) ${skip.missingTeamIds.join(", ")} never accumulated, player and staff archival skipped`;
    case "staff-fetch-failed":
      return `staff archival skipped: club-wide staff fetch failed (${skip.error})`;
    case "orphan-cap":
      return `${skip.entity}: ${skip.orphanCount}/${skip.activeCount} would be archived (${Math.round(skip.ratio * 100)} %), over the safety cap`;
  }
};

/**
 * `null` means "report nothing this invocation": `phase === undefined` (the
 * sync failed outright, `psd-sanity-sync`'s own report covers that) and
 * `"not-run"` (no cycle end tonight, or a manual run). Neither proves a
 * prior skip released, so reporting `ok: true` there would fire a false
 * recovery ping.
 */
export function cleanupJobOutcome(
  phase: CleanupOutcome | undefined,
): JobOutcome | null {
  if (phase === undefined || phase.kind === "not-run") return null;
  if (phase.kind === "ok") return { ok: true };
  const capRefusals = phase.skips.filter((s) => s.kind === "orphan-cap");
  const lever =
    capRefusals.length > 0
      ? `. This does not self-heal: once confirmed genuine, release with the sync:orphan-cap-override KV key set to ${capRefusals.map((s) => s.entity).join(", ")} (apps/api/CLAUDE.md, "Releasing a stuck PSD sync orphan-cap refusal")`
      : "";
  return {
    ok: false,
    error: new Error(
      `psd-sanity-sync-cleanup: ${phase.skips.map(describeSkip).join("; ")}${lever}`,
    ),
  };
}
