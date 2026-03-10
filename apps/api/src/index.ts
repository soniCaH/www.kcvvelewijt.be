/**
 * KCVV API — Cloudflare Worker BFF
 *
 * Implements PsdApi from @kcvv/api-contract using HttpApiBuilder.
 * Proxies ProSoccerData API calls with Cloudflare KV caching.
 *
 * Per-request handler: env (KV namespace, secrets) is injected fresh each
 * request via WorkerEnvTag, so we build and dispose the runtime per-request.
 */
import {
  Etag,
  FileSystem,
  HttpApiBuilder,
  HttpMiddleware,
  HttpPlatform,
  Path,
} from "@effect/platform";
import { Effect, Layer } from "effect";
import { PsdApi } from "@kcvv/api-contract";
import { WorkerEnvTag, type WorkerEnv } from "./env";
import { FootbalistoClientLive } from "./footbalisto/client";
import { KvCacheLive } from "./cache/kv-cache";
import { MatchesApiLive } from "./handlers/matches";
import { RankingApiLive } from "./handlers/ranking";
import { StatsApiLive } from "./handlers/stats";
import { SanityWriteClientLive } from "./sanity/client";
import { runSync } from "./sync/psd-sanity-sync";

/**
 * Provides DefaultServices (HttpPlatform | Etag.Generator | FileSystem | Path)
 * required by HttpApiBuilder. We use no-op FileSystem since this Worker
 * never serves files — only JSON responses.
 */
const WorkerPlatformLayer = Layer.mergeAll(
  FileSystem.layerNoop({}),
  Etag.layer,
  Path.layer,
  HttpPlatform.layer.pipe(Layer.provide(FileSystem.layerNoop({}))),
);

function buildAppLayer(env: WorkerEnv) {
  return HttpApiBuilder.api(PsdApi).pipe(
    Layer.provide(MatchesApiLive),
    Layer.provide(RankingApiLive),
    Layer.provide(StatsApiLive),
    Layer.provide(FootbalistoClientLive),
    Layer.provide(KvCacheLive),
    Layer.provide(Layer.succeed(WorkerEnvTag, env)),
    Layer.provideMerge(WorkerPlatformLayer),
  );
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const { handler, dispose } = HttpApiBuilder.toWebHandler(
      buildAppLayer(env),
      { middleware: HttpMiddleware.cors() },
    );
    try {
      return await handler(request);
    } finally {
      await dispose();
    }
  },

  async scheduled(
    _event: ScheduledEvent,
    env: WorkerEnv,
    ctx: ExecutionContext,
  ): Promise<void> {
    const envLayer = Layer.succeed(WorkerEnvTag, env);
    const layer = Layer.mergeAll(
      FootbalistoClientLive,
      SanityWriteClientLive,
      envLayer,
    ).pipe(Layer.provide(KvCacheLive), Layer.provide(envLayer));
    ctx.waitUntil(
      Effect.runPromise(Effect.provide(runSync, layer)).catch((e) => {
        console.error(
          "[scheduled] runSync promise rejected:",
          String(e),
          e instanceof Error ? e.stack : "",
        );
      }),
    );
  },
};
