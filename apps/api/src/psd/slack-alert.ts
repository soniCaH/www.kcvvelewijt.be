/**
 * Slack incident/drift alert payloads for PSD failures (#2329).
 *
 * Framework-free so both the `PsdGate` Durable Object (incident pings, plain
 * async) and the Effect-based KV cache serve-stale path (slow-drift nudge) can
 * share it. `postSlack` is best-effort and a no-op when the webhook secret is
 * absent (same pattern as RESEND_API_KEY) — a down Slack must never break the
 * read path.
 */
import type { IncidentAlert } from "./incident";

/** Human duration, coarse: "3d 4h", "5h 12m", "45m", "30s". */
export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export interface IncidentContext {
  /** Cache key / endpoint that triggered the transition. */
  readonly key: string;
  /** HTTP status of the failure (e.g. 429), when known. */
  readonly status?: number;
  /** Stringified upstream error, when known. */
  readonly error?: string;
  /** Age of the stale value being served (ms), when one exists. */
  readonly staleAgeMs?: number;
}

/** Message for an incident state change (outage start / recovery). */
export function buildIncidentMessage(
  alert: IncidentAlert,
  ctx: IncidentContext,
): string {
  if (alert.kind === "recovery") {
    return `:large_green_circle: *PSD recovered* — \`${ctx.key}\` after ${formatDuration(
      alert.durationMs,
    )} of failures.`;
  }
  const status = ctx.status ? ` (HTTP ${ctx.status})` : "";
  const detail = ctx.error ? `: ${ctx.error}` : "";
  const stale =
    ctx.staleAgeMs !== undefined
      ? ` Serving stale (${formatDuration(ctx.staleAgeMs)} old) until it recovers.`
      : " Serving stale until it recovers.";
  return `:red_circle: *PSD outage started* — \`${ctx.key}\`${status} is failing${detail}.${stale}`;
}

export interface DriftContext {
  /** Cache key / endpoint serving stale. */
  readonly key: string;
  /** How long the served value has been stale. */
  readonly staleAgeMs: number;
  /** Hard TTL — the value is evicted (the "cliff") once stale age reaches this. */
  readonly hardTtlMs: number;
  /** HTTP status of the failing refresh, when known. */
  readonly status?: number;
}

/** Message for the slow-drift nudge: stale data creeping toward the hard cliff. */
export function buildDriftMessage(ctx: DriftContext): string {
  const timeToCliff = Math.max(0, ctx.hardTtlMs - ctx.staleAgeMs);
  const status = ctx.status ? ` (last refresh: HTTP ${ctx.status})` : "";
  return `:warning: *PSD data drifting stale* — \`${ctx.key}\` is ${formatDuration(
    ctx.staleAgeMs,
  )} old${status}; ${formatDuration(timeToCliff)} until it drops off the hard-expiry cliff.`;
}

export interface JobAlertContext {
  /** Name of the scheduled job (e.g. "psd-sanity-sync", "sanity-index-sync"). */
  readonly job: string;
  /** How many consecutive runs have failed — the current streak on a
   * `job-failure` alert, or the streak that just ended on a `job-recovery`. */
  readonly consecutiveFailures: number;
  /** Stringified error from the failing run, when known. */
  readonly error?: string;
}

/**
 * State transition for the debounced scheduled-job failure signal (#2870) —
 * deliberately its own union, not {@link IncidentAlert}. This never feeds
 * `IncidentTracker`: a failed nightly cron is not the same event as PSD
 * being down for visitors. See `psd/job-alert.ts`.
 */
export type JobAlert =
  { readonly kind: "job-failure" } | { readonly kind: "job-recovery" };

/** Message for a scheduled-job failure/recovery transition. */
export function buildJobAlertMessage(
  alert: JobAlert,
  ctx: JobAlertContext,
): string {
  const runs = ctx.consecutiveFailures === 1 ? "run" : "runs";
  if (alert.kind === "job-recovery") {
    return `:large_green_circle: *Scheduled job recovered* — \`${ctx.job}\` succeeded after ${ctx.consecutiveFailures} failed ${runs}.`;
  }
  const detail = ctx.error ? `: ${ctx.error}` : "";
  return `:red_circle: *Scheduled job failing* — \`${ctx.job}\` has now failed ${ctx.consecutiveFailures} consecutive ${runs}${detail}.`;
}

/**
 * Best-effort POST to a Slack incoming webhook. No-op when `webhookUrl` is
 * absent (local/dev without the secret). Never throws.
 */
export async function postSlack(
  webhookUrl: string | undefined,
  text: string,
): Promise<void> {
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    // Best-effort: alerting must never break the read path.
  }
}
