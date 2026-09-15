/**
 * Live background-refresh runner (see background.ts for the seam + rationale).
 *
 * Runs each SWR refresh on a layer built straight from `env` — independent of
 * the per-request Effect runtime, which `index.ts` disposes in a `finally` — and
 * keeps the isolate alive with `ctx.waitUntil`. Imported only by the worker
 * entry, so pulling in the full PSD read stack here can't create an import cycle
 * with `cache/kv-cache.ts`.
 */
import { Effect, Layer } from "effect";
import { WorkerEnvTag, type WorkerEnv } from "../env";
import { KvCacheLive } from "../cache/kv-cache";
import { SanityProjectionLive } from "../sanity/projection";
import { PsdServiceLive } from "./service";
import { PsdGateLive } from "./gate";
import { BackgroundRunnerService, type BackgroundRunner } from "./background";
import { VectorizeServiceLive } from "../search/vectorize";

/** Every service a background refresh may need, exposing every PsdRefreshEnv
 * member — the PSD read stack plus VectorizeService, since `handlers/related.ts`
 * also refreshes through this runner (see the comment on PsdRefreshEnv). */
const backgroundStackLayer = (env: WorkerEnv) =>
  PsdServiceLive.pipe(
    Layer.provideMerge(
      Layer.mergeAll(
        KvCacheLive,
        PsdGateLive,
        SanityProjectionLive,
        VectorizeServiceLive,
      ),
    ),
    Layer.provideMerge(Layer.succeed(WorkerEnvTag, env)),
  );

export const makeBackgroundRunner = (
  env: WorkerEnv,
  ctx: ExecutionContext,
): BackgroundRunner => {
  const layer = backgroundStackLayer(env);
  return {
    fork: (label, effect) =>
      Effect.sync(() => {
        ctx.waitUntil(
          Effect.runPromise(Effect.scoped(Effect.provide(effect, layer))).catch(
            (e: unknown) =>
              console.error(
                `[bg:${label}]`,
                e instanceof Error ? (e.stack ?? e.message) : String(e),
              ),
          ),
        );
      }),
  };
};

export const BackgroundRunnerLive = (env: WorkerEnv, ctx: ExecutionContext) =>
  Layer.succeed(BackgroundRunnerService, makeBackgroundRunner(env, ctx));
