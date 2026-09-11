/**
 * Scheduled-job failure signal (#2870).
 *
 * Debounced Slack alerting for the two nightly crons (`runSync`,
 * `runSanityIndexSync`) — entirely independent of PsdGate's IncidentTracker.
 * A failed 02:00 sync is not the same event as PSD being down for visitors:
 * the read path reads `incidentOpen` back to escalate its serve-stale logs
 * WARN→ERROR (`cache/kv-cache.ts`), so routing a job failure through
 * `gate.reportOutcome` would make request-path logs shout — and fire a
 * "PSD outage started" Slack ping — while the site serves visitors from
 * cache perfectly fine. This module never imports `psd/incident.ts` or
 * `psd/gate.ts`, and `reportScheduledJobOutcome`'s Effect signature below
 * cannot even reach `PsdGateService` — see `job-alert.test.ts` /
 * `cache/kv-cache.test.ts` for the pinning tests.
 *
 * Debounce mirrors `IncidentTracker`'s open/recover shape (#2329): alert
 * only on the first failure after healthy, and the first success after ≥1
 * failures. State is KV-persisted rather than in-memory — unlike the `PsdGate`
 * Durable Object, a scheduled Worker invocation starts with nothing in
 * memory — using a cheap per-job counter key with a TTL, the same shape as
 * the drift nudge's `nudge:{key}` marker (`cache/kv-cache.ts`).
 */
import { Effect } from "effect";
import { WorkerEnvTag } from "../env";
import { KvCacheService } from "../cache/kv-cache";
import { buildJobAlertMessage, postSlack, type JobAlert } from "./slack-alert";

export interface JobAlertState {
  /** 0 = healthy. */
  readonly consecutiveFailures: number;
}

const HEALTHY: JobAlertState = { consecutiveFailures: 0 };

/**
 * Pure open/recover decision, mirroring `IncidentTracker.report` (#2329):
 * alert only on the transition INTO failure (first failure after healthy)
 * and the transition OUT of it (first success after ≥1 failures). A job
 * failing every night for a week produces one alert, not seven.
 */
export function decideJobAlert(
  state: JobAlertState,
  ok: boolean,
): { readonly next: JobAlertState; readonly alert: JobAlert | null } {
  if (ok) {
    if (state.consecutiveFailures === 0) return { next: state, alert: null };
    return { next: HEALTHY, alert: { kind: "job-recovery" } };
  }
  const wasHealthy = state.consecutiveFailures === 0;
  return {
    next: { consecutiveFailures: state.consecutiveFailures + 1 },
    alert: wasHealthy ? { kind: "job-failure" } : null,
  };
}

export const jobAlertKey = (job: string): string => `job-alert:${job}`;

/** Comfortably longer than the daily cron interval, so one delayed/missed
 * invocation doesn't silently reset a streak. */
export const JOB_ALERT_STATE_TTL = 60 * 60 * 24 * 3; // 3 days

/** Parse the persisted counter, guarding against a malformed value the same
 * way `KvCacheLive.increment` does — a bad string must never wedge the job
 * into "permanently failing" or "permanently healthy". */
function parseState(raw: string | null): JobAlertState {
  const n = raw ? parseInt(raw, 10) : 0;
  return { consecutiveFailures: Number.isFinite(n) && n > 0 ? n : 0 };
}

/**
 * Report one scheduled-job outcome for debounced Slack alerting. Best-effort
 * and never fails — a `KvCacheService` hiccup or an absent
 * `SLACK_ALERT_WEBHOOK_URL` (staging, deliberately — see apps/api/CLAUDE.md)
 * must never break the scheduled job it observes.
 */
export const reportScheduledJobOutcome = (
  job: string,
  outcome:
    { readonly ok: true } | { readonly ok: false; readonly error: unknown },
): Effect.Effect<void, never, KvCacheService | WorkerEnvTag> =>
  Effect.gen(function* () {
    const cache = yield* KvCacheService;
    const env = yield* WorkerEnvTag;
    const key = jobAlertKey(job);
    const state = parseState(yield* cache.get(key));
    const { next, alert } = decideJobAlert(state, outcome.ok);

    if (next.consecutiveFailures === 0) {
      if (state.consecutiveFailures !== 0) yield* cache.delete(key);
    } else {
      yield* cache.set(
        key,
        String(next.consecutiveFailures),
        JOB_ALERT_STATE_TTL,
      );
    }

    if (alert !== null) {
      const consecutiveFailures =
        alert.kind === "job-recovery"
          ? state.consecutiveFailures
          : next.consecutiveFailures;
      yield* Effect.promise(() =>
        postSlack(
          env.SLACK_ALERT_WEBHOOK_URL,
          buildJobAlertMessage(alert, {
            job,
            consecutiveFailures,
            error: outcome.ok ? undefined : String(outcome.error),
          }),
        ),
      );
    }
  });
