import { Context, Effect, Layer, Option, Schema as S } from "effect";
import { WorkerEnvTag } from "../env";

/** Per-endpoint TTLs in seconds */
export const TTL = {
  MATCHES_TEAM: 60 * 60 * 24, // 24 hours — season schedule rarely changes mid-week
  NEXT_MATCHES: 60 * 60 * 4, // 4 hours — no live scores, schedule is stable for hours
  MATCH_DETAIL_PAST: 60 * 60 * 24 * 7, // 7 days — historical, never changes
  MATCH_DETAIL_DEFAULT: 60 * 60 * 24, // 24 hours — upcoming/recent matches
  RANKING: 60 * 60 * 24, // 24 hours — updates only after a match day
  STATS: 60 * 60 * 24, // 24 hours — season stats updated weekly at most
} as const;

export interface KvCacheInterface {
  readonly get: (key: string) => Effect.Effect<string | null>;
  readonly set: (
    key: string,
    value: string,
    ttl: number,
  ) => Effect.Effect<void>;
  /** Increment a daily counter by n (default 1). Key format: psd:calls:YYYY-MM-DD. */
  readonly increment: (key: string, by?: number) => Effect.Effect<void>;
}

export class KvCacheService extends Context.Tag("KvCacheService")<
  KvCacheService,
  KvCacheInterface
>() {}

/** Default hard TTL: 7 days — safety net for stale-on-error */
export const HARD_TTL_DEFAULT = 60 * 60 * 24 * 7;

export const TypedKvCache = <A>(schema: S.Schema<A, any>) => {
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
    ): Effect.Effect<A, E, R | KvCacheService> =>
      Effect.gen(function* () {
        const cache = yield* KvCacheService;
        const cached = yield* cache.get(key);

        if (cached !== null) {
          const decoded = yield* Effect.try({
            try: () => JSON.parse(cached),
            catch: (e) => new Error(String(e)),
          }).pipe(
            Effect.flatMap(S.decodeUnknown(WrapperSchema)),
            Effect.tapError((e) =>
              Effect.logWarning(
                `TypedKvCache: cache decode failed for key "${key}": ${String(e)}`,
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
            const refreshed = yield* fetch.pipe(
              Effect.map((freshValue) => ({ freshValue, ok: true as const })),
              Effect.catchAll(() =>
                Effect.gen(function* () {
                  yield* Effect.logWarning(
                    `TypedKvCache: refresh failed for key "${key}", serving stale data (age: ${Math.round((Date.now() - fetchedAt) / 1000)}s)`,
                  );
                  return { freshValue: value, ok: false as const };
                }),
              ),
            );

            if (refreshed.ok) {
              const wrapper = JSON.stringify({
                value: refreshed.freshValue,
                fetchedAt: Date.now(),
              });
              yield* cache.set(key, wrapper, hardTtl);
            }

            return refreshed.freshValue;
          }
        }

        // Cache miss: fetch, wrap, store
        const value = yield* fetch;
        const wrapper = JSON.stringify({ value, fetchedAt: Date.now() });
        yield* cache.set(key, wrapper, hardTtl);
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
      increment: (key: string, by = 1) =>
        Effect.tryPromise({
          try: async () => {
            const current = await env.PSD_CACHE.get(key);
            const next = (current ? parseInt(current, 10) : 0) + by;
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
