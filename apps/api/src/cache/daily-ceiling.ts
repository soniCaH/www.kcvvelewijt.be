import { Effect } from "effect";
import type { KvCacheInterface } from "./kv-cache";

// Daily KV counters and ceilings, shared by the PSD on-demand budget
// (`kv-cache.ts`) and the AI answer cap (`search/ai-answer.ts`) (#3468).

/** UTC date as `YYYY-MM-DD` — the day key of every daily counter. */
export const utcDay = (d: Date = new Date()): string =>
  d.toISOString().slice(0, 10);

/** A non-negative integer `[vars]` ceiling, or `undefined` (no ceiling) when
 * the var is unset or not a number. `0` is accepted on purpose: it refuses
 * everything, a kill switch. */
export const parseCeiling = (raw: string | undefined): number | undefined => {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

/** A raw KV counter value as a number: absent or malformed reads as `0`, so a
 * stray "NaN" can never persist and poison every later increment. */
export const parseCount = (raw: string | null): number => {
  const n = Number.parseInt(raw ?? "0", 10);
  return Number.isFinite(n) ? n : 0;
};

/** How long a once-per-day marker lives: two days, so it outlives its day. */
const MARKER_TTL = 60 * 60 * 48;

/** Runs `act` only if `markerKey` (a key carrying the UTC day) is not yet
 * set, writing the marker first. Approximate — KV is not atomic. */
export const oncePerDay = <E, R>(
  cache: KvCacheInterface,
  markerKey: string,
  act: Effect.Effect<void, E, R>,
): Effect.Effect<void, E, R> =>
  Effect.gen(function* () {
    if ((yield* cache.get(markerKey)) !== null) return;
    yield* cache.set(markerKey, "1", MARKER_TTL);
    yield* act;
  });
