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
 * Debounce mirrors `IncidentTracker`'s open/recover shape (#2329): alert on
 * the first failure after healthy, and keep retrying on every subsequent
 * failure until Slack actually confirms delivery (`postSlack` reports
 * whether the POST landed, not just whether it was attempted — a dropped
 * webhook POST must never debounce a whole outage into announcing it zero
 * times), then stay silent for the rest of that streak. Alert once,
 * best-effort, on the first success after ≥1 failures. State is KV-persisted
 * rather than in-memory — unlike the `PsdGate` Durable Object, a scheduled
 * Worker invocation starts with nothing in memory — using a cheap per-job
 * state key with a TTL, the same shape as the drift nudge's `nudge:{key}`
 * marker (`cache/kv-cache.ts`).
 */
import { Effect } from "effect";
import { WorkerEnvTag } from "../env";
import { KvCacheService, type KvCacheInterface } from "../cache/kv-cache";
import { buildJobAlertMessage, postSlack, type JobAlert } from "./slack-alert";

export interface JobAlertState {
  /** 0 = healthy. */
  readonly consecutiveFailures: number;
  /** Has Slack confirmed delivery of the failure alert for the CURRENT
   * streak? Only meaningful while `consecutiveFailures > 0`. Stays `false`
   * across a dropped `postSlack` POST so the very next failure retries the
   * alert instead of silently debouncing an outage nobody was ever told
   * about (#2870 review). */
  readonly announced: boolean;
}

const HEALTHY: JobAlertState = { consecutiveFailures: 0, announced: false };

/**
 * Pure open/recover decision, mirroring `IncidentTracker.report` (#2329):
 * alert only while the CURRENT failure streak hasn't been confirmed
 * delivered yet, and on the transition OUT of failure (first success after
 * ≥1 failures). A job failing every night for a week — once its first alert
 * actually lands — produces one failure alert, not seven.
 */
export function decideJobAlert(
  state: JobAlertState,
  ok: boolean,
): { readonly next: JobAlertState; readonly alert: JobAlert | null } {
  if (ok) {
    if (state.consecutiveFailures === 0) return { next: state, alert: null };
    return { next: HEALTHY, alert: { kind: "job-recovery" } };
  }
  const next: JobAlertState = {
    consecutiveFailures: state.consecutiveFailures + 1,
    announced: state.announced,
  };
  return { next, alert: state.announced ? null : { kind: "job-failure" } };
}

export const jobAlertKey = (job: string): string => `job-alert:${job}`;

/** Comfortably longer than the daily cron interval, so one delayed/missed
 * invocation doesn't silently reset a streak. */
export const JOB_ALERT_STATE_TTL = 60 * 60 * 24 * 3; // 3 days

/** Parse the persisted state, guarding against a malformed value the same
 * way `KvCacheLive.increment` does — a bad value must never wedge the job
 * into "permanently failing" or "permanently healthy". */
function parseState(raw: string | null): JobAlertState {
  if (raw == null) return HEALTHY;
  try {
    const parsed: unknown = JSON.parse(raw);
    const n = (parsed as { consecutiveFailures?: unknown }).consecutiveFailures;
    if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return HEALTHY;
    const announced = (parsed as { announced?: unknown }).announced === true;
    return { consecutiveFailures: n, announced };
  } catch {
    return HEALTHY;
  }
}

/** Persist `next`, deleting the key once healthy (skipping a no-op delete
 * when it was already healthy) rather than writing a `0` entry every night. */
function persistState(
  cache: KvCacheInterface,
  key: string,
  previous: JobAlertState,
  next: JobAlertState,
): Effect.Effect<void> {
  if (next.consecutiveFailures === 0) {
    return previous.consecutiveFailures === 0 ? Effect.void : cache.delete(key);
  }
  return cache.set(key, JSON.stringify(next), JOB_ALERT_STATE_TTL);
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

    if (alert === null) {
      yield* persistState(cache, key, state, next);
      return;
    }

    const consecutiveFailures =
      alert.kind === "job-recovery"
        ? state.consecutiveFailures
        : next.consecutiveFailures;
    const posted = yield* Effect.promise(() =>
      postSlack(
        env.SLACK_ALERT_WEBHOOK_URL,
        buildJobAlertMessage(alert, {
          job,
          consecutiveFailures,
          error: outcome.ok ? undefined : String(outcome.error),
        }),
      ),
    );

    if (alert.kind === "job-recovery") {
      // Best-effort: even a dropped recovery POST still clears the streak —
      // `postSlack` already logged the drop, and losing one "recovered"
      // ping is far less costly than losing the outage ping that announces
      // the problem in the first place (the asymmetry this review fixed).
      yield* persistState(cache, key, state, HEALTHY);
      return;
    }

    // Failure alert: only mark the streak "announced" once Slack has
    // actually confirmed the POST landed. Otherwise it stays `false`, so
    // the NEXT failure retries the alert.
    yield* persistState(cache, key, state, {
      consecutiveFailures: next.consecutiveFailures,
      announced: posted,
    });
  });
