import { Context, Effect, Either, Layer, Option, Schema as S } from "effect";
import { WorkerEnvTag } from "../env";
import { PsdGateService } from "../psd/gate";
import { BackgroundRunnerService, type PsdRefreshEnv } from "../psd/background";
import {
  buildDriftMessage,
  formatDuration,
  postSlack,
} from "../psd/slack-alert";

/**
 * Per-endpoint soft TTLs in seconds.
 *
 * Every PSD-backed (match) TTL is ≥15 min: with stale-while-revalidate the soft
 * TTL only sets the background-refresh cadence — stale is always served
 * instantly — so a tighter window bought nothing but PSD load (#2321). KCVV has
 * no live scores, so the old 60 s "live" tier was already moot.
 */
export const TTL = {
  MATCHES_TEAM: 60 * 60 * 24, // 24 hours — season schedule rarely changes mid-week
  NEXT_MATCHES: 60 * 60 * 4, // 4 hours — no live scores, schedule is stable for hours
  MATCHES_WINDOW: 60 * 60 * 4, // 4 hours — matchday picker; in-window matches stay listed regardless of refresh
  MATCH_DETAIL_PAST: 60 * 60 * 24 * 7, // 7 days — historical, never changes
  MATCH_DETAIL_DEFAULT: 60 * 60 * 24, // 24 hours — distant (kickoff >7d away)
  MATCH_DETAIL_LIVE: 60 * 15, // 15 min — floor: no live scores, SWR serves stale instantly
  MATCH_DETAIL_MATCHDAY: 60 * 15, // 15 min — matchday / result-pending refresh cadence
  MATCH_DETAIL_WEEK: 60 * 60, // 1 hour — this week
  RANKING: 60 * 60 * 24, // 24 hours — updates only after a match day
  RELATED: 60 * 60 * 6, // 6 hours — related content changes infrequently
  OPPONENT_HISTORY: 60 * 60 * 24 * 7, // 7 days — historical match data doesn't change
  PLAYER_STATS: 60 * 60 * 6, // 6 hours — player stats update after match days
} as const;

/** Persisted negative marker TTL (seconds). Suppresses re-storming after a failed
 * refresh: subsequent requests serve stale without re-fanning until it expires.
 * (KV's minimum expirationTtl is 60 s.) */
export const NEG_MARKER_TTL = 120; // 2 min

/** Time (seconds) a value may sit PAST ITS SOFT TTL before we escalate logs
 * WARN→ERROR and emit a slow-drift Slack nudge — refreshes are not landing and
 * the value is creeping toward the hard-expiry cliff.
 *
 * Measured relative to the soft TTL, not as absolute age (#2335): a healthy
 * 24 h-softTtl key (`MATCHES_TEAM`, `RANKING`) is stale by design between
 * refreshes, so an absolute rule would nudge on every normal cycle. */
export const DRIFT_NUDGE_THRESHOLD = 60 * 60 * 24; // 24 h (#2329)

/** Ceiling on a background (SWR) refresh fetch, so a slow one takes the normal
 * failure path (negative marker + escalating log) instead of being silently
 * killed (#2335).
 *
 * Two ceilings bound this, and the LOWER one binds: Cloudflare cancels
 * `waitUntil` work ~30 s after the invocation ends, but `GateLogic.leaseMs`
 * (15 s, `psd/gate-logic.ts`) reclaims the single-flight lease first. Outrunning
 * the lease is the worse failure: the next reader becomes leader and forks a
 * SECOND full fan-out under exactly the load that made the first one slow, and
 * the original's `endFlight` then releases the new leader's flight. So this must
 * stay strictly under `leaseMs`, not merely under the `waitUntil` budget.
 *
 * 12 s leaves 3 s of lease headroom for the failure-path KV write. The gate
 * paces 5 PSD calls/s globally, so a 19-call fan-out is ~3.8 s uncontended —
 * 12 s tolerates roughly 3 concurrent fan-outs before it starts tripping. */
export const BG_REFRESH_TIMEOUT_MS = 12_000;

/** Dedup window for the slow-drift nudge: at most one Slack ping per day per key. */
export const NUDGE_MARKER_TTL = 60 * 60 * 24; // 24 h

export interface KvCacheInterface {
  readonly get: (key: string) => Effect.Effect<string | null>;
  readonly set: (
    key: string,
    value: string,
    ttl: number,
  ) => Effect.Effect<void>;
  readonly delete: (key: string) => Effect.Effect<void>;
  /** Increment today's PSD-call counter by n (default 1). Owns the daily key (psd:calls:YYYY-MM-DD). */
  readonly increment: (by?: number) => Effect.Effect<void>;
}

export class KvCacheService extends Context.Tag("KvCacheService")<
  KvCacheService,
  KvCacheInterface
>() {}

/** Default hard TTL: 7 days — safety net for stale-on-error */
export const HARD_TTL_DEFAULT = 60 * 60 * 24 * 7;

/** Long hard TTL: 365 days — used on staging to minimize PSD API quota usage */
export const HARD_TTL_LONG = 60 * 60 * 24 * 365;

const negKey = (key: string): string => `neg:${key}`;
const nudgeKey = (key: string): string => `nudge:${key}`;

/**
 * `TypedKvCache` is shared by PSD-backed callers and one non-PSD caller:
 * `handlers/related.ts`'s `related:*` keys, whose `fetch` needs
 * `VectorizeService` rather than `PsdService` (see the `PsdRefreshEnv` doc in
 * `psd/background.ts`). `gate.reportOutcome` feeds the GLOBAL PSD incident
 * tracker (`psd/incident.ts`), so only a PSD-backed key's outcome may reach
 * it — a Vectorize-only success must never close a real PSD outage, and a
 * Vectorize-only failure must never open a false one (#2868 review).
 */
const isPsdBackedKey = (key: string): boolean => !key.startsWith("related:");

/** Best-effort HTTP status off an upstream error (UpstreamUnavailable carries one). */
const statusOf = (e: unknown): number | undefined => {
  const s = (e as { status?: unknown }).status;
  return typeof s === "number" ? s : undefined;
};

export const TypedKvCache = <A, I>(schema: S.Schema<A, I>) => {
  const WrapperSchema = S.Struct({
    value: schema,
    fetchedAt: S.Number,
  });

  /** Decode a raw KV string into {value, fetchedAt}, tolerating the legacy
   * pre-wrapper format (raw value, fetchedAt: 0). None on any decode failure. */
  const decodeEntry = (
    key: string,
    cached: string,
  ): Effect.Effect<Option.Option<{ value: A; fetchedAt: number }>> =>
    Effect.try({
      try: () => JSON.parse(cached),
      catch: (e) => new Error(String(e)),
    }).pipe(
      Effect.flatMap((parsed) =>
        S.decodeUnknown(WrapperSchema)(parsed).pipe(
          Effect.catchAll(() =>
            S.decodeUnknown(schema)(parsed).pipe(
              Effect.map((value) => ({ value, fetchedAt: 0 })),
              Effect.catchAll((legacyErr) =>
                Effect.zipRight(
                  Effect.logWarning(
                    `TypedKvCache: cache decode failed for key "${key}": ${String(legacyErr)}`,
                  ),
                  Effect.fail(legacyErr),
                ),
              ),
            ),
          ),
        ),
      ),
      Effect.option,
    );

  const wrap = (value: A): string =>
    JSON.stringify({ value, fetchedAt: Date.now() });

  return {
    getOrFetch: <E, R extends PsdRefreshEnv>(
      key: string,
      fetch: Effect.Effect<A, E, R>,
      softTtl: number | ((value: A) => number),
      hardTtl: number = HARD_TTL_DEFAULT,
      options?: {
        shouldServeStale?: (error: E) => boolean;
        /** Correctness guard: when the STALE value fails this predicate (e.g. a
         * "next" list whose kickoff has already passed), refresh blocking rather
         * than serving stale. */
        mustBlockOnStale?: (value: A) => boolean;
        /** Ceiling on the background (SWR) refresh fetch. Defaults to
         * {@link BG_REFRESH_TIMEOUT_MS}; tests drive it with a small value. */
        backgroundTimeoutMs?: number;
      },
    ): Effect.Effect<
      A,
      E,
      R | KvCacheService | WorkerEnvTag | PsdGateService
    > =>
      Effect.gen(function* () {
        const cache = yield* KvCacheService;
        const env = yield* WorkerEnvTag;
        const gate = yield* PsdGateService;
        const runnerOpt = yield* Effect.serviceOption(BackgroundRunnerService);
        const effectiveHardTtl =
          env.CACHE_LONG_TTL === "true" ? HARD_TTL_LONG : hardTtl;
        const shouldServeStale = options?.shouldServeStale ?? (() => true);
        const backgroundTimeoutMs =
          options?.backgroundTimeoutMs ?? BG_REFRESH_TIMEOUT_MS;

        /** Time (ms) a value has spent PAST its soft TTL — the drift measure.
         * The single place this arithmetic lives. See DRIFT_NUDGE_THRESHOLD. */
        const staleFor = (fetchedAt: number, softTtlSec: number) =>
          Date.now() - fetchedAt - softTtlSec * 1000;

        const isDrifting = (staleForMs: number) =>
          staleForMs > DRIFT_NUDGE_THRESHOLD * 1000;

        // Persist a fresh value and clear any negative marker.
        const persist = (value: A) =>
          Effect.zipRight(
            cache.set(key, wrap(value), effectiveHardTtl),
            cache.delete(negKey(key)),
          );

        // Slow-drift Slack ping, once per day per key. Reports ABSOLUTE age +
        // time-to-cliff — only the decision to call this is soft-TTL-relative.
        const nudge = (staleAgeMs: number, status?: number) =>
          Effect.gen(function* () {
            // Once/day/key: skip if we already pinged within the marker window.
            if ((yield* cache.get(nudgeKey(key))) !== null) return;
            yield* cache.set(nudgeKey(key), "1", NUDGE_MARKER_TTL);
            yield* Effect.promise(() =>
              postSlack(
                env.SLACK_ALERT_WEBHOOK_URL,
                buildDriftMessage({
                  key,
                  staleAgeMs,
                  hardTtlMs: effectiveHardTtl * 1000,
                  status,
                }),
              ),
            );
          });

        // Keep the stale copy: log why and set the negative marker so subsequent
        // requests serve stale without re-fanning until it expires. Given an
        // `alert` context, the log escalates WARN→ERROR when an outage is open OR
        // the value is drifting (#2329). Called without `alert` for keeps that
        // carry no stale-age context → plain WARN.
        const keepStale = (
          reason: string,
          alert?: {
            readonly fetchedAt: number;
            readonly softTtlSec: number;
            readonly incidentOpen: boolean;
            readonly status?: number;
          },
        ) =>
          Effect.gen(function* () {
            const drifting =
              !!alert &&
              isDrifting(staleFor(alert.fetchedAt, alert.softTtlSec));
            const escalate = !!alert && (alert.incidentOpen || drifting);
            const line = `TypedKvCache "${key}": ${reason}`;
            yield* escalate ? Effect.logError(line) : Effect.logWarning(line);
            yield* cache.set(negKey(key), "1", NEG_MARKER_TTL);
            // Fallback nudge only: the read-path check fires first on every
            // stale read and normally claims the once/day marker, so this covers
            // the case where its KV write did not land. It carries `status`,
            // which the read path has no access to.
            if (alert && drifting)
              yield* nudge(Date.now() - alert.fetchedAt, alert.status);
          });

        // Report a transient-outage refresh failure to the gate (incident
        // alerting) and keep the stale copy — escalating the log / nudging via
        // the returned incident state + drift age. Shared by both refresh paths.
        const failAndKeepStale = (
          err: unknown,
          fetchedAt: number,
          softTtlSec: number,
          label: string,
        ) =>
          Effect.gen(function* () {
            const status = statusOf(err);
            const staleAgeMs = Date.now() - fetchedAt;
            // Non-PSD key → skip the report (see isPsdBackedKey): no
            // incidentOpen state applies to it either, so escalation below
            // falls back to the plain (non-alert) WARN.
            const { incidentOpen } = yield* isPsdBackedKey(key)
              ? gate.reportOutcome({
                  ok: false,
                  key,
                  status,
                  error: String(err),
                  staleAgeMs,
                })
              : Effect.succeed({ incidentOpen: false });
            yield* keepStale(`${label} (${String(err)})`, {
              fetchedAt,
              softTtlSec,
              incidentOpen,
              status,
            });
          });

        // Store a fresh value (schema-validated) and clear any negative marker.
        const storeFresh = (value: A) =>
          Effect.zipRight(
            S.decodeUnknown(schema)(value).pipe(Effect.orDie),
            persist(value),
          );

        // Foreground refresh: fetch, store on success, serve stale on a
        // serve-stale error (setting the negative marker so we stop re-fanning),
        // propagate otherwise. Used by the correctness guard and, when no
        // background runner is wired, as the stale fallback.
        const blockingRefresh = (
          staleValue: A,
          fetchedAt: number,
          softTtlSec: number,
        ) =>
          Effect.gen(function* () {
            const result = yield* fetch.pipe(Effect.either);
            if (Either.isRight(result)) {
              yield* gate.reportOutcome({ ok: true, key });
              yield* storeFresh(result.right);
              return result.right;
            }
            if (!shouldServeStale(result.left)) {
              // Not a transient PSD outage (404 / decode) → don't touch incident.
              return yield* Effect.fail(result.left);
            }
            yield* failAndKeepStale(
              result.left,
              fetchedAt,
              softTtlSec,
              "refresh failed, serving stale",
            );
            return staleValue;
          });

        // Background (SWR) refresh: single-flight leader fetches and updates KV;
        // any failure (or schema-invalid data) keeps stale + marks. Never throws
        // — it runs detached via the background runner.
        const backgroundRefresh = (fetchedAt: number, softTtlSec: number) =>
          Effect.gen(function* () {
            const leader = yield* gate.beginFlight(key);
            if (!leader) return; // another isolate/fiber is already refreshing
            yield* Effect.gen(function* () {
              // Bounded (#2335): a refresh that outruns the `waitUntil` budget
              // gets killed mid-flight, so NONE of the handlers below run — no
              // marker, no log, no nudge, and every next request re-forks the
              // same doomed refresh while the value drifts toward the cliff.
              const outcome = yield* fetch.pipe(
                Effect.either,
                Effect.timeoutOption(backgroundTimeoutMs),
              );
              if (Option.isNone(outcome)) {
                // Deliberately no `reportOutcome`: a slow fan-out under load is
                // not proof PSD is down (the global 5/s pacer alone makes ~5
                // concurrent fan-outs this slow), and reporting it would open
                // spurious "PSD outage started" pings. Sustained timeouts
                // surface through the drift nudge instead.
                return yield* keepStale(
                  `background refresh timed out after ${backgroundTimeoutMs}ms`,
                  { fetchedAt, softTtlSec, incidentOpen: false },
                );
              }
              const result = outcome.value;
              if (Either.isLeft(result)) {
                if (!shouldServeStale(result.left)) {
                  // Non-outage failure (decode) → keep stale, plain WARN.
                  return yield* keepStale(
                    `background refresh failed (${String(result.left)})`,
                  );
                }
                return yield* failAndKeepStale(
                  result.left,
                  fetchedAt,
                  softTtlSec,
                  "background refresh failed",
                );
              }
              // Non-PSD key → skip the report (see isPsdBackedKey) so a
              // Vectorize-only success can't be misread as "PSD recovered".
              yield* isPsdBackedKey(key)
                ? gate.reportOutcome({ ok: true, key })
                : Effect.void;
              const valid = S.decodeUnknownOption(schema)(result.right);
              yield* Option.isSome(valid)
                ? persist(result.right)
                : // Not a PSD outage (200 w/ bad shape), but the value still
                  // drifts toward the cliff — nudge if it's aged past threshold.
                  keepStale("background refresh returned schema-invalid data", {
                    fetchedAt,
                    softTtlSec,
                    incidentOpen: false,
                  });
            }).pipe(Effect.ensuring(gate.endFlight(key)));
          });

        const cached = yield* cache.get(key);

        if (cached !== null) {
          const decoded = yield* decodeEntry(key, cached);

          if (Option.isSome(decoded)) {
            const { value, fetchedAt } = decoded.value;
            const resolvedSoftTtl =
              typeof softTtl === "function" ? softTtl(value) : softTtl;
            const staleForMs = staleFor(fetchedAt, resolvedSoftTtl);

            if (staleForMs <= 0) return value; // fresh

            // ── Stale ────────────────────────────────────────────────────────
            // Drift check FIRST (#2335). Every other drift signal hangs off a
            // refresh reporting its outcome, and a `waitUntil` refresh that gets
            // killed reports nothing — so this read-path check is the only one
            // that fires regardless of whether any refresh ever ran. It also
            // sits above the negative-marker early-return below, so a key whose
            // marker keeps being re-set still nudges. Pure arithmetic: the
            // once/day dedup read only happens on a genuinely drifting key, so
            // the normal stale path costs no extra KV I/O.
            if (isDrifting(staleForMs)) {
              yield* Effect.logError(
                `TypedKvCache "${key}": serving stale ${formatDuration(staleForMs)} past its soft TTL — refreshes are not landing`,
              );
              // Detached: the nudge does a KV get + set + an unbounded Slack
              // POST, and this is the serve-stale-INSTANTLY path. Inline only
              // when no runner is wired (no `waitUntil` to hand it to).
              const ping = nudge(Date.now() - fetchedAt);
              yield* Option.isSome(runnerOpt)
                ? runnerOpt.value.fork(`drift:${key}`, ping)
                : ping;
            }

            // Negative marker present → a recent refresh failed; serve stale
            // instantly and do not re-fan. This wins even over the correctness
            // guard below: during an outage, a bounded ≤2 min of possibly-wrong
            // "next" beats storming PSD ~19 calls/request while it's down (the
            // marker self-heals the moment PSD recovers).
            const marker = yield* cache.get(negKey(key));
            if (marker !== null) return value;

            // Correctness guard: a stale value that is now wrong (past-kickoff
            // "next") must not be served — refresh blocking.
            if (options?.mustBlockOnStale?.(value)) {
              return yield* blockingRefresh(value, fetchedAt, resolvedSoftTtl);
            }

            if (Option.isSome(runnerOpt)) {
              // Stale-while-revalidate: serve stale NOW, refresh in the
              // background (single-flight) via the runner — see background-live.ts.
              // `R extends PsdRefreshEnv` on `getOrFetch` makes this safe by
              // construction: `fetch`'s own requirements are already within
              // what the runner's layer provides.
              const refresh = backgroundRefresh(fetchedAt, resolvedSoftTtl);
              yield* runnerOpt.value.fork(`refresh:${key}`, refresh);
              return value;
            }

            // No background runner wired → fall back to a blocking refresh.
            return yield* blockingRefresh(value, fetchedAt, resolvedSoftTtl);
          }
        }

        // ── Cache miss (or undecodable) ──────────────────────────────────────
        // Single-flight loop: ONLY the leader ever fetches, so at no instant do
        // two fan-outs run for the same key. Concurrent misses collapse to one
        // fan-out (followers read the leader's cached result). If the leader
        // finishes without populating (it failed), followers re-enter — one
        // becomes the next leader while the rest await it, so failed misses
        // serialize (never a concurrent duplicate fan-out) and each surfaces a
        // real never-cached error (AC7). Leadership rotation guarantees every
        // fiber makes progress; the gate's lease reclaims a dead leader, so this
        // can't spin forever.
        for (;;) {
          const isLeader = yield* gate.beginFlight(key);
          if (isLeader) {
            return yield* Effect.gen(function* () {
              const result = yield* fetch.pipe(Effect.either);
              if (Either.isRight(result)) {
                yield* gate.reportOutcome({ ok: true, key });
                yield* storeFresh(result.right);
                return result.right;
              }
              // Never-cached miss failure: report a transient PSD outage so the
              // incident alert still fires on a cold start, then surface it.
              if (shouldServeStale(result.left)) {
                yield* gate.reportOutcome({
                  ok: false,
                  key,
                  status: statusOf(result.left),
                  error: String(result.left),
                });
              }
              return yield* Effect.fail(result.left);
            }).pipe(Effect.ensuring(gate.endFlight(key)));
          }

          yield* gate.awaitFlight(key);
          const afterWait = yield* cache.get(key);
          if (afterWait !== null) {
            const reread = yield* decodeEntry(key, afterWait);
            if (Option.isSome(reread)) return reread.value.value;
          }
          // Empty → the leader failed; loop to re-enter the flight.
        }
      }),
  };
};

export const KvCacheLive = Layer.effect(
  KvCacheService,
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;
    return {
      get: (key: string) =>
        Effect.tryPromise({
          try: () => env.PSD_CACHE.get(key),
          catch: () => null,
        }).pipe(Effect.orElseSucceed(() => null)),
      set: (key: string, value: string, ttl: number) =>
        Effect.tryPromise({
          try: () => env.PSD_CACHE.put(key, value, { expirationTtl: ttl }),
          catch: () => undefined,
        }).pipe(Effect.orElseSucceed(() => undefined)),
      delete: (key: string) =>
        Effect.tryPromise({
          try: () => env.PSD_CACHE.delete(key),
          catch: () => undefined,
        }).pipe(Effect.orElseSucceed(() => undefined)),
      increment: (by = 1) =>
        Effect.tryPromise({
          try: async () => {
            const d = new Date();
            const key = `psd:calls:${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
            const current = await env.PSD_CACHE.get(key);
            // Guard against a malformed cached value: parseInt on a
            // non-numeric string yields NaN, which would persist as "NaN"
            // and break every future increment until the 48 h TTL expires.
            const parsed = current ? parseInt(current, 10) : 0;
            const next = (Number.isFinite(parsed) ? parsed : 0) + by;
            // Keep counter for 48 h so yesterday's value stays visible
            await env.PSD_CACHE.put(key, String(next), {
              expirationTtl: 60 * 60 * 48,
            });
          },
          catch: () => undefined,
        }).pipe(Effect.orElseSucceed(() => undefined)),
    };
  }),
);
