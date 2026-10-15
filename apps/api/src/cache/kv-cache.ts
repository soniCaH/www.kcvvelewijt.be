import { Context, Effect, Either, Layer, Option, Schema as S } from "effect";
import { WorkerEnvTag } from "../env";
import { PsdGateService } from "../psd/gate";
import { BackgroundRunnerService, type PsdRefreshEnv } from "../psd/background";
import {
  buildDriftMessage,
  buildPsdBudgetMessage,
  formatDuration,
  postSlack,
} from "../psd/slack-alert";
import { ResourceNotFoundError, UpstreamUnavailableError } from "../psd/errors";
import { oncePerDay, parseCeiling, parseCount, utcDay } from "./daily-ceiling";

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
  SEASONS: 60 * 60 * 24, // 24 hours — the season list changes once a year
  PARTIAL_FANOUT: 60 * 5, // 5 min — a fan-out with a failed team (#3489): serve the teams that loaded, retry soon
  SEARCH: 60 * 60, // 1 hour — full SearchResponse, answer included (#3468)
} as const;

/** How long a cold miss that PSD answered "not found" is remembered under the
 * same key, so a repeated unknown id costs no PSD call (#3468). */
export const NOT_FOUND_TTL = 60 * 60; // 1 hour

/** Today's PSD-call counter (`increment` writes it, the on-demand budget reads it). */
export const psdCallsKey = (d: Date = new Date()): string =>
  `psd:calls:${utcDay(d)}`;

/** Persisted negative marker TTL (seconds). Suppresses re-storming after a failed
 * refresh: subsequent requests serve stale without re-fanning until it expires.
 * (KV's minimum expirationTtl is 60 s.) */
const NEG_MARKER_TTL = 120; // 2 min

/** Time (seconds) a value may sit PAST ITS SOFT TTL before we escalate logs
 * WARN→ERROR and emit a slow-drift Slack nudge — refreshes are not landing and
 * the value is creeping toward the hard-expiry cliff.
 *
 * Measured relative to the soft TTL, not as absolute age (#2335): a healthy
 * 24 h-softTtl key (`MATCHES_TEAM`, `RANKING`) is stale by design between
 * refreshes, so an absolute rule would nudge on every normal cycle. */
const DRIFT_NUDGE_THRESHOLD = 60 * 60 * 24; // 24 h (#2329)

/** Ceiling on a background (SWR) refresh fetch, so a slow one takes the normal
 * failure path (negative marker + escalating log) instead of being silently
 * killed (#2335).
 *
 * Two ceilings bound this, and the LOWER one binds: Cloudflare cancels
 * `waitUntil` work ~30 s after the invocation ends, but `GateLogic.leaseMs`
 * (15 s, `psd/gate-logic.ts`) reclaims the single-flight lease first. Outrunning
 * the lease is the worse failure: the next reader becomes leader and forks a
 * SECOND full fan-out under exactly the load that made the first one slow (the
 * original's `endFlight` no longer releases the new leader's flight: it carries
 * an owner token, #3467). So this must
 * stay strictly under `leaseMs`, not merely under the `waitUntil` budget.
 *
 * 12 s leaves 3 s of lease headroom for the failure-path KV write. The gate
 * paces 5 PSD calls/s globally, so a 19-call fan-out is ~3.8 s uncontended —
 * 12 s tolerates roughly 3 concurrent fan-outs before it starts tripping. */
export const BG_REFRESH_TIMEOUT_MS = 12_000;

/** Whole-fetch cap for the cold-miss leader (#3467). Same reasoning and same
 * 12 s as {@link BG_REFRESH_TIMEOUT_MS}: the leader holds a 15 s lease, and
 * queue waits at the 5/s gate alone can push a fan-out past it. A per-call
 * abort does not help — only a cap on the fetch as a whole does. */
export const MISS_FETCH_TIMEOUT_MS = 12_000;

/** Dedup window for the slow-drift nudge: at most one Slack ping per day per key. */
const NUDGE_MARKER_TTL = 60 * 60 * 24; // 24 h

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
  /**
   * KV operations for callers outside the SWR read path — see `DurableKv`'s
   * doc comment for why they surface `KvError` instead of swallowing it
   * like get/set/delete above (#2873).
   */
  readonly durable: DurableKv;
}

/**
 * A KV op failed. Unlike get/set/delete/increment above — whose whole point
 * is to be silently forgiving, because a cache miss must never break a read
 * path — every `DurableKv` operation surfaces this instead of swallowing it.
 * A caller reaching for `durable` has already decided a KV blip must not be
 * quietly reinterpreted as "absent" (`sync/psd-sanity-sync.ts`'s KV reads,
 * several of which fail the whole sync on error) or "empty"
 * (`search/index-manifest.ts`'s `readManifest` — an empty read would tell
 * the nightly sweep it's safe to prune every tracked id, exactly the bug
 * #2831 fixed by making `readManifest` fail instead of falling back to
 * `[]`).
 */
export class KvError extends Error {
  readonly _tag = "KvError" as const;
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

/** One page of a `list` call — Cloudflare's own cursor-paged shape (`keys`
 * flattened to names). `search/index-manifest.ts`'s `listPendingIds` loops
 * on `complete` until it has drained every page, same as it always has —
 * this only moves where the `KVNamespace.list` call itself happens. */
export interface KvListPage {
  readonly keys: readonly string[];
  readonly cursor?: string;
  readonly complete: boolean;
}

/**
 * KV operations for callers the SWR-cache shape (get/set/delete/increment
 * above) never fit: a TTL-bearing write that FAILS on error rather than
 * swallowing it (`set`), a write with NO expiry at all (`setForever` — the
 * port's original gap: the SWR `set` requires a `ttl`, so "this must never
 * expire" had no way to be said), a single-page `list`, and `delete`.
 */
export interface DurableKv {
  readonly get: (key: string) => Effect.Effect<string | null, KvError>;
  readonly set: (
    key: string,
    value: string,
    ttl: number,
  ) => Effect.Effect<void, KvError>;
  readonly setForever: (
    key: string,
    value: string,
  ) => Effect.Effect<void, KvError>;
  readonly delete: (key: string) => Effect.Effect<void, KvError>;
  readonly list: (params: {
    readonly prefix: string;
    readonly cursor?: string;
  }) => Effect.Effect<KvListPage, KvError>;
  /**
   * Binds every operation above to one Sanity dataset, captured ONCE per
   * call site instead of threaded as a `dataset: string` argument repeated
   * (and possibly stale or mismatched) on every individual call —
   * `search/index-manifest.ts`'s five functions used to take `dataset` as
   * their own parameter each, so within one flow they could each be handed
   * a *different* value; now they all take the same scoped handle this
   * returns and read `.dataset` off it. That narrows the #2833 failure
   * class from "any of five call sites can mismatch" down to "the one
   * `forDataset` call at the top of the function can be wrong" — a real
   * reduction in where the bug can hide, not a guarantee it can't happen:
   * `forDataset` doesn't own key construction (see the next paragraph), so
   * a caller can still pass the wrong dataset to it, or build a key from a
   * different string entirely.
   *
   * Callers still own how a *logical* key maps to bytes — see
   * `manifestKey`/`pendingKey` in `search/index-manifest.ts` — this handle
   * neither knows nor enforces a naming scheme, so the exact key strings
   * already in KV are unaffected by scoping through it. Folding
   * `manifestKey`/`pendingKey` into this handle would turn the narrowing
   * above into an actual guarantee (a key could only ever be built from
   * `.dataset`) — deliberately not done here, since it would mean
   * generating the key bytes through a new, port-owned path instead of the
   * existing, already-correct functions, and behaviour preservation (the
   * exact same key strings, byte-for-byte) was the higher priority for
   * this change.
   */
  readonly forDataset: (dataset: string) => DurableKvScoped;
}

export interface DurableKvScoped extends Omit<DurableKv, "forDataset"> {
  readonly dataset: string;
}

/**
 * Builds `DurableKv` operations directly off a raw `KVNamespace` — shared by
 * `KvCacheLive` (the live binding) and by tests that already hold a fake
 * `KVNamespace` and want to exercise `search/index-manifest.ts`'s functions
 * directly rather than through the full Layer/Effect wiring.
 */
export function makeDurableKv(kv: KVNamespace): DurableKv {
  const ops = {
    get: (key: string) =>
      Effect.tryPromise({
        try: () => kv.get(key),
        catch: (cause) =>
          new KvError(`KV get failed for "${key}": ${String(cause)}`, cause),
      }),
    set: (key: string, value: string, ttl: number) =>
      Effect.tryPromise({
        try: () => kv.put(key, value, { expirationTtl: ttl }),
        catch: (cause) =>
          new KvError(`KV put failed for "${key}": ${String(cause)}`, cause),
      }),
    setForever: (key: string, value: string) =>
      Effect.tryPromise({
        try: () => kv.put(key, value),
        catch: (cause) =>
          new KvError(`KV put failed for "${key}": ${String(cause)}`, cause),
      }),
    delete: (key: string) =>
      Effect.tryPromise({
        try: () => kv.delete(key),
        catch: (cause) =>
          new KvError(`KV delete failed for "${key}": ${String(cause)}`, cause),
      }),
    list: ({ prefix, cursor }: { prefix: string; cursor?: string }) =>
      Effect.tryPromise({
        try: async () => {
          const page = await kv.list({ prefix, cursor });
          return {
            keys: page.keys.map((k) => k.name),
            cursor: page.list_complete ? undefined : page.cursor,
            complete: page.list_complete,
          };
        },
        catch: (cause) =>
          new KvError(
            `KV list failed for prefix "${prefix}": ${String(cause)}`,
            cause,
          ),
      }),
  };
  return {
    ...ops,
    forDataset: (dataset: string) => ({ ...ops, dataset }),
  };
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
const budgetAlertKey = (day: string): string => `psd:budget-alert:${day}`;

/** What a not-found marker stores in place of a value (#3468). */
const NotFoundMarker = S.parseJson(
  S.Struct({
    notFound: S.Struct({
      message: S.String,
      resourceType: S.String,
      resourceId: S.Union(S.String, S.Number),
    }),
  }),
);
const decodeNotFound = S.decodeUnknownOption(NotFoundMarker);

/** Whether a raw KV value is a not-found marker rather than a cached value. */
export const isNotFoundMarker = (raw: string): boolean =>
  Option.isSome(decodeNotFound(raw));
const nudgeKey = (key: string): string => `nudge:${key}`;

/** Best-effort HTTP status off an upstream error (UpstreamUnavailable carries one). */
const statusOf = (e: unknown): number | undefined => {
  const s = (e as { status?: unknown }).status;
  return typeof s === "number" ? s : undefined;
};

export const TypedKvCache = <A, I>(
  schema: S.Schema<A, I>,
  options?: {
    /**
     * Whether a refresh through this cache instance may report to the
     * GLOBAL PSD incident tracker (`gate.reportOutcome`, `psd/incident.ts`).
     * Defaults to `true` — every cache is PSD-backed except
     * `handlers/related.ts`'s (`related:*` keys, whose `fetch` needs
     * `VectorizeService` rather than `PsdService`; see the `PsdRefreshEnv`
     * doc in `psd/background.ts`).
     *
     * This is a property of the CACHE INSTANCE, not of the key string — a
     * per-key prefix check drifts silently the moment a second non-PSD
     * cache is added (#2868 review: an allowlist-by-prefix would classify
     * a hypothetical future `search:` cache as PSD-backed by default and
     * quietly reopen the exact bug this option exists to prevent, with no
     * test failure and no compile error to announce it). Declaring it here
     * instead makes a new non-PSD cache state its own exclusion; every
     * existing `TypedKvCache(schema)` call keeps today's behaviour
     * unchanged.
     */
    readonly psdBacked?: boolean;
  },
) => {
  const psdBacked = options?.psdBacked ?? true;
  const WrapperSchema = S.Struct({
    value: schema,
    fetchedAt: S.Finite,
    // Set when the fetch reported its value as built from an incomplete
    // fan-out (#3489). Optional, so every entry written before it still decodes.
    partial: S.optional(S.Boolean),
  });

  /** Decode a raw KV string into {value, fetchedAt}, tolerating the legacy
   * pre-wrapper format (raw value, fetchedAt: 0). None on any decode failure. */
  const decodeEntry = (
    key: string,
    cached: string,
  ): Effect.Effect<
    Option.Option<{ value: A; fetchedAt: number; partial?: boolean }>
  > =>
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

  const wrap = (value: A, partial: boolean): string =>
    JSON.stringify({
      value,
      fetchedAt: Date.now(),
      ...(partial ? { partial: true } : {}),
    });

  return {
    getOrFetch: <E, R extends PsdRefreshEnv>(
      key: string,
      fetch: Effect.Effect<A, E, R>,
      softTtl: number | ((value: A) => number),
      hardTtl: number = HARD_TTL_DEFAULT,
      options?: {
        shouldServeStale?: (error: E) => boolean;
        /** Ceiling on the background (SWR) refresh fetch. Defaults to
         * {@link BG_REFRESH_TIMEOUT_MS}; tests drive it with a small value. */
        backgroundTimeoutMs?: number;
        /** Whole-fetch cap for the cold-miss leader. Defaults to
         * {@link MISS_FETCH_TIMEOUT_MS}; tests drive it with a small value. */
        fetchTimeoutMs?: number;
        /** True when a freshly fetched value came from an incomplete fan-out
         * (#3489). It is stored flagged and treated as stale after
         * {@link TTL.PARTIAL_FANOUT}, so the missing part heals in minutes
         * instead of waiting out the full soft TTL. */
        isPartial?: (value: A) => boolean;
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
        const fetchTimeoutMs = options?.fetchTimeoutMs ?? MISS_FETCH_TIMEOUT_MS;

        /** Time (ms) a value has spent PAST its soft TTL — the drift measure.
         * The single place this arithmetic lives. See DRIFT_NUDGE_THRESHOLD. */
        const staleFor = (fetchedAt: number, softTtlSec: number) =>
          Date.now() - fetchedAt - softTtlSec * 1000;

        const isDrifting = (staleForMs: number) =>
          staleForMs > DRIFT_NUDGE_THRESHOLD * 1000;

        // The ONLY way this cache reports to the gate: a non-PSD cache
        // instance never does (see the `psdBacked` option doc above), on
        // every path — cold miss, blocking and background refresh.
        const report = (outcome: Parameters<typeof gate.reportOutcome>[0]) =>
          psdBacked
            ? gate.reportOutcome(outcome)
            : Effect.succeed({ incidentOpen: false });

        // Persist a fresh value and clear any negative marker.
        const persist = (value: A) =>
          Effect.zipRight(
            cache.set(
              key,
              wrap(value, options?.isPartial?.(value) ?? false),
              effectiveHardTtl,
            ),
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
            // Non-PSD cache → incidentOpen false, so escalation below falls
            // back to the plain (non-alert) WARN.
            const { incidentOpen } = yield* report({
              ok: false,
              key,
              status,
              error: String(err),
              staleAgeMs,
            });
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

        // Background (SWR) refresh: single-flight leader fetches and updates KV;
        // any failure (or schema-invalid data) keeps stale + marks. Never throws
        // — it runs detached via the background runner.
        const backgroundRefresh = (fetchedAt: number, softTtlSec: number) =>
          Effect.gen(function* () {
            const token = yield* gate.beginFlight(key);
            if (token === null) return; // another isolate/fiber is already refreshing
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
              yield* report({ ok: true, key });
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
            }).pipe(Effect.ensuring(gate.endFlight(key, token)));
          });

        // A not-found marker stands in for the value: fail exactly as the
        // fetch did, with no PSD call (#3468). The cast is sound by
        // construction — a marker is written only from this key's own
        // `fetch` failing with ResourceNotFoundError, so E includes it.
        const failIfNotFound = (raw: string | null) => {
          const marker = raw === null ? Option.none() : decodeNotFound(raw);
          return Option.isSome(marker)
            ? Effect.fail(
                new ResourceNotFoundError(
                  marker.value.notFound,
                ) as unknown as E,
              )
            : Effect.void;
        };

        // On-demand PSD budget (#3468): once today's PSD-call count reaches
        // PSD_ONDEMAND_DAILY_BUDGET, a cold miss fails fast. Only the cold
        // miss — a stale key still serves stale and refreshes in the
        // background, and the cron sync never comes through here. Cast as
        // above: every psdBacked cache fetches through PsdService (BffError).
        const budget = parseCeiling(env.PSD_ONDEMAND_DAILY_BUDGET);
        const checkBudget = Effect.gen(function* () {
          if (!psdBacked || budget === undefined) return;
          const spent = parseCount(yield* cache.get(psdCallsKey()));
          if (spent < budget) return;
          const day = utcDay();
          yield* Effect.logError(
            `TypedKvCache "${key}": PSD on-demand budget reached (${spent}/${budget} on ${day}) — cold miss refused`,
          );
          yield* oncePerDay(
            cache,
            budgetAlertKey(day),
            Effect.promise(() =>
              postSlack(
                env.SLACK_ALERT_WEBHOOK_URL,
                buildPsdBudgetMessage({ day, spent, budget }),
              ),
            ),
          );
          return yield* Effect.fail(
            new UpstreamUnavailableError({
              message: `PSD on-demand daily budget reached (${spent}/${budget})`,
            }) as unknown as E,
          );
        });

        const cached = yield* cache.get(key);
        yield* failIfNotFound(cached);

        if (cached !== null) {
          const decoded = yield* decodeEntry(key, cached);

          if (Option.isSome(decoded)) {
            const { value, fetchedAt, partial } = decoded.value;
            const fullSoftTtl =
              typeof softTtl === "function" ? softTtl(value) : softTtl;
            const resolvedSoftTtl = partial
              ? Math.min(fullSoftTtl, TTL.PARTIAL_FANOUT)
              : fullSoftTtl;
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

            // Stale-while-revalidate: serve stale NOW, refresh in the
            // background (single-flight) via the runner — see background-live.ts.
            // `R extends PsdRefreshEnv` on `getOrFetch` makes this safe by
            // construction: `fetch`'s own requirements are already within
            // what the runner's layer provides. No runner (tests only) → the
            // same single-flight, bounded refresh runs inline. Either way there
            // is no unguarded foreground fan-out (#3467).
            const refresh = backgroundRefresh(fetchedAt, resolvedSoftTtl);
            yield* Option.isSome(runnerOpt)
              ? runnerOpt.value.fork(`refresh:${key}`, refresh)
              : refresh;
            return value;
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
          const token = yield* gate.beginFlight(key);
          if (token !== null) {
            return yield* Effect.gen(function* () {
              yield* checkBudget;
              // Capped as a whole, under the lease (#3467). A timeout reports
              // nothing: a slow fan-out is not proof PSD is down.
              const timed = yield* fetch.pipe(
                Effect.either,
                Effect.timeoutOption(fetchTimeoutMs),
              );
              if (Option.isNone(timed)) {
                return yield* Effect.fail(
                  new UpstreamUnavailableError({
                    message: `TypedKvCache "${key}": fetch timed out after ${fetchTimeoutMs}ms`,
                  }) as unknown as E,
                );
              }
              const result = timed.value;
              if (Either.isRight(result)) {
                yield* report({ ok: true, key });
                yield* storeFresh(result.right);
                return result.right;
              }
              if (result.left instanceof ResourceNotFoundError) {
                const { message, resourceType, resourceId } = result.left;
                yield* cache.set(
                  key,
                  JSON.stringify({
                    notFound: { message, resourceType, resourceId },
                  }),
                  NOT_FOUND_TTL,
                );
              }
              // Never-cached miss failure: report a transient PSD outage so the
              // incident alert still fires on a cold start, then surface it.
              if (shouldServeStale(result.left)) {
                yield* report({
                  ok: false,
                  key,
                  status: statusOf(result.left),
                  error: String(result.left),
                });
              }
              return yield* Effect.fail(result.left);
            }).pipe(Effect.ensuring(gate.endFlight(key, token)));
          }

          yield* gate.awaitFlight(key);
          const afterWait = yield* cache.get(key);
          yield* failIfNotFound(afterWait);
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
            const key = psdCallsKey();
            const next = parseCount(await env.PSD_CACHE.get(key)) + by;
            // Keep counter for 48 h so yesterday's value stays visible
            await env.PSD_CACHE.put(key, String(next), {
              expirationTtl: 60 * 60 * 48,
            });
          },
          catch: () => undefined,
        }).pipe(Effect.orElseSucceed(() => undefined)),
      durable: makeDurableKv(env.PSD_CACHE),
    };
  }),
);
