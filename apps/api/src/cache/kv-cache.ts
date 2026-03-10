import { Context, Effect, Layer } from "effect";
import { WorkerEnvTag } from "../env";

/** Per-endpoint TTLs in seconds */
export const TTL = {
  MATCHES_TEAM: 60 * 60 * 6, // 6 hours — season schedule rarely changes mid-week
  NEXT_MATCHES: 60 * 30, // 30 minutes — home page widget; was 5 min (too aggressive)
  MATCH_DETAIL_PAST: 60 * 60 * 24 * 7, // 7 days — historical, never changes
  MATCH_DETAIL_LIVE: 60, // 60 seconds — live match updates
  RANKING: 60 * 60 * 4, // 4 hours — updates only after a match day
  STATS: 60 * 60 * 12, // 12 hours — season stats updated weekly at most
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
