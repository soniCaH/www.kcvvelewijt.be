/**
 * Background refresh runner — the stale-while-revalidate execution seam.
 *
 * When a soft-lapsed key is read, the cache serves stale INSTANTLY and schedules
 * the refresh here. The refresh must survive the response returning: the
 * per-request Effect runtime is `dispose()`d in a `finally`, so a fiber forked on
 * it would be interrupted. The live runner (see background-live.ts) therefore
 * runs the refresh on a fresh layer built from `env` and extends the isolate's
 * life with `ctx.waitUntil` — both independent of the request runtime.
 *
 * This module is a leaf (type-only imports) so `cache/kv-cache.ts` can depend on
 * the tag without a `kv-cache → background → service → kv-cache` runtime cycle.
 */
import { Context, Effect } from "effect";
import type { WorkerEnvTag } from "../env";
import type { KvCacheService } from "../cache/kv-cache";
import type { PsdService } from "./service";
import type { PsdGateService } from "./gate";
import type { VectorizeService } from "../search/vectorize";

/**
 * Everything a background refresh may need; the live runner's layer (see
 * background-live.ts) provides every member. Despite the name, this is not
 * PSD-exclusive: `handlers/related.ts` also runs its `getOrFetch` through
 * this same runner and its fetch requires `VectorizeService`, not
 * `PsdService` (#2868 — constraining `getOrFetch`'s `R` to this union
 * surfaced that the runner's layer didn't cover that caller; fixed here by
 * widening the union and `backgroundStackLayer` together, not by excluding
 * the caller).
 *
 * Because a non-PSD caller now genuinely runs through this seam,
 * `TypedKvCache` (`cache/kv-cache.ts`) takes a `psdBacked` option — a
 * property of the CACHE INSTANCE, not a key-prefix guess — and
 * `handlers/related.ts` declares `psdBacked: false`, so `getOrFetch` never
 * lets a Vectorize-only refresh's outcome reach `gate.reportOutcome` (which
 * feeds the GLOBAL PSD incident tracker, `psd/incident.ts`): it must never
 * open or close a PSD outage on Vectorize's behalf (#2868 review).
 */
export type PsdRefreshEnv =
  | PsdService
  | KvCacheService
  | PsdGateService
  | WorkerEnvTag
  | VectorizeService;

export interface BackgroundRunner {
  /** Fire-and-forget a refresh on an env-built layer via `ctx.waitUntil`. */
  readonly fork: (
    label: string,
    effect: Effect.Effect<void, unknown, PsdRefreshEnv>,
  ) => Effect.Effect<void>;
}

export class BackgroundRunnerService extends Context.Tag(
  "BackgroundRunnerService",
)<BackgroundRunnerService, BackgroundRunner>() {}
