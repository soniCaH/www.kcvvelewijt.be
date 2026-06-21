import { Context, Effect, Layer, Option, Schema as S } from "effect";
import { WorkerEnvTag } from "../env";

/** Per-endpoint TTLs in seconds */
export const TTL = {
  MATCHES_TEAM: 60 * 60 * 24, // 24 hours — season schedule rarely changes mid-week
  NEXT_MATCHES: 60 * 60 * 4, // 4 hours — no live scores, schedule is stable for hours
  MATCHES_WINDOW: 60 * 60 * 4, // 4 hours — matchday picker; in-window matches stay listed regardless of refresh
  MATCH_DETAIL_PAST: 60 * 60 * 24 * 7, // 7 days — historical, never changes
  MATCH_DETAIL_DEFAULT: 60 * 60 * 24, // 24 hours — distant (kickoff >7d away)
  MATCH_DETAIL_LIVE: 60, // <3h from kickoff — live, refresh aggressively
  MATCH_DETAIL_MATCHDAY: 60 * 5, // <24h from kickoff — matchday
  MATCH_DETAIL_WEEK: 60 * 60, // <7d from kickoff — this week
  RANKING: 60 * 60 * 24, // 24 hours — updates only after a match day
  RELATED: 60 * 60 * 6, // 6 hours — related content changes infrequently
  OPPONENT_HISTORY: 60 * 60 * 24 * 7, // 7 days — historical match data doesn't change
  PLAYER_STATS: 60 * 60 * 6, // 6 hours — player stats update after match days
} as const;

export interface KvCacheInterface {
  readonly get: (key: string) => Effect.Effect<string | null>;
  readonly set: (
    key: string,
    value: string,
    ttl: number,
  ) => Effect.Effect<void>;
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

export const TypedKvCache = <A, I>(schema: S.Schema<A, I>) => {
  const WrapperSchema = S.Struct({
    value: schema,
    fetchedAt: S.Number,
  });

  return {
    getOrFetch: <E, R>(
      key: string,
      fetch: Effect.Effect<A, E, R>,
      softTtl: number | ((value: A) => number),
      hardTtl: number = HARD_TTL_DEFAULT,
      options?: { shouldServeStale?: (error: E) => boolean },
    ): Effect.Effect<A, E, R | KvCacheService | WorkerEnvTag> =>
      Effect.gen(function* () {
        const cache = yield* KvCacheService;
        const env = yield* WorkerEnvTag;
        const effectiveHardTtl =
          env.CACHE_LONG_TTL === "true" ? HARD_TTL_LONG : hardTtl;
        const cached = yield* cache.get(key);

        if (cached !== null) {
          const decoded = yield* Effect.try({
            try: () => JSON.parse(cached),
            catch: (e) => new Error(String(e)),
          }).pipe(
            Effect.flatMap((parsed) =>
              S.decodeUnknown(WrapperSchema)(parsed).pipe(
                Effect.catchAll(() =>
                  // Legacy pre-wrapper format: try decoding raw value
                  S.decodeUnknown(schema)(parsed).pipe(
                    Effect.tap(() =>
                      Effect.logDebug(
                        `TypedKvCache: legacy cache entry for key "${key}" — will migrate on next fetch`,
                      ),
                    ),
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

          if (Option.isSome(decoded)) {
            const { value, fetchedAt } = decoded.value;
            const resolvedSoftTtl =
              typeof softTtl === "function" ? softTtl(value) : softTtl;
            const isFresh = (Date.now() - fetchedAt) / 1000 <= resolvedSoftTtl;

            if (isFresh) return value;

            // Stale: attempt refresh, fall back to stale on error
            const shouldServeStale = options?.shouldServeStale ?? (() => true);
            const refreshed = yield* fetch.pipe(
              Effect.map((freshValue) => ({ freshValue, ok: true as const })),
              Effect.catchAll((err) => {
                if (!shouldServeStale(err)) {
                  return Effect.fail(err);
                }
                return Effect.gen(function* () {
                  yield* Effect.logWarning(
                    `TypedKvCache: refresh failed for key "${key}", serving stale data (age: ${Math.round((Date.now() - fetchedAt) / 1000)}s, error: ${String(err)})`,
                  );
                  return { freshValue: value, ok: false as const };
                });
              }),
            );

            if (refreshed.ok) {
              yield* S.decodeUnknown(schema)(refreshed.freshValue).pipe(
                Effect.orDie,
              );
              const wrapper = JSON.stringify({
                value: refreshed.freshValue,
                fetchedAt: Date.now(),
              });
              yield* cache.set(key, wrapper, effectiveHardTtl);
            }

            return refreshed.freshValue;
          }
        }

        // Cache miss: fetch, validate, wrap, store
        const value = yield* fetch;
        yield* S.decodeUnknown(schema)(value).pipe(Effect.orDie);
        const wrapper = JSON.stringify({ value, fetchedAt: Date.now() });
        yield* cache.set(key, wrapper, effectiveHardTtl);
        return value;
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
