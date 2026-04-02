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
import { PsdTeamClientLive } from "./sync/psd-team-client";
import { FootbalistoServiceLive } from "./footbalisto/service";
import { KvCacheLive } from "./cache/kv-cache";
import { MatchesApiLive } from "./handlers/matches";
import { OpponentApiLive } from "./handlers/opponent";
import { RankingApiLive } from "./handlers/ranking";
import { RelatedApiLive } from "./handlers/related";
import { SearchApiLive } from "./handlers/search";
import { EmbeddingServiceLive } from "./search/embedding";
import { VectorizeServiceLive } from "./search/vectorize";
import { AiAnswerServiceLive } from "./search/ai-answer";
import { runSanityIndexSync } from "./search/sanity-index-sync";
import { SanityWriteClientLive } from "./sanity/client";
import { SanityProjectionLive } from "./sanity/projection";
import { runSync } from "./sync/psd-sanity-sync";
import { handleIndexWebhook } from "./webhooks/index-handler";

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

/**
 * Creates an application layer that builds the PsdApi runtime wired with live service implementations and the provided worker environment.
 *
 * @param env - The Worker environment (bindings such as KV namespaces and secrets) to supply to the runtime
 * @returns A Layer supplying the PsdApi implementation composed with live services (matches, ranking, search, embedding, vectorization, HTTP client, KV cache) and required platform services
 */
function buildAppLayer(env: WorkerEnv) {
  return HttpApiBuilder.api(PsdApi).pipe(
    Layer.provide(MatchesApiLive),
    Layer.provide(OpponentApiLive),
    Layer.provide(RankingApiLive),
    Layer.provide(RelatedApiLive),
    Layer.provide(SearchApiLive),
    Layer.provide(EmbeddingServiceLive),
    Layer.provide(VectorizeServiceLive),
    Layer.provide(AiAnswerServiceLive),
    Layer.provide(FootbalistoServiceLive),
    Layer.provide(SanityProjectionLive),
    Layer.provide(SanityWriteClientLive),
    Layer.provide(KvCacheLive),
    Layer.provide(Layer.succeed(WorkerEnvTag, env)),
    Layer.provideMerge(WorkerPlatformLayer),
  );
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    // Webhook routes bypass Effect — raw Request/Response
    if (
      request.method === "POST" &&
      new URL(request.url).pathname === "/webhooks/index"
    ) {
      try {
        return await handleIndexWebhook(request, env);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[webhook] unhandled error:", err);
        return Response.json(
          { ok: false, error: message, code: "internal_error" },
          { status: 500 },
        );
      }
    }

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
    event: ScheduledEvent,
    env: WorkerEnv,
    ctx: ExecutionContext,
  ): Promise<void> {
    const envLayer = Layer.succeed(WorkerEnvTag, env);

    if (event.cron === "30 2 * * *") {
      // Search embedding index sync — separate invocation budget
      const layer = Layer.mergeAll(
        EmbeddingServiceLive,
        VectorizeServiceLive,
        envLayer,
      ).pipe(Layer.provide(envLayer));
      ctx.waitUntil(
        Effect.runPromise(Effect.provide(runSanityIndexSync(), layer)).catch(
          (e) => {
            console.error(
              "[scheduled] sanity-index-sync failed:",
              String(e),
              e instanceof Error ? e.stack : "",
            );
            throw e;
          },
        ),
      );
    } else if (event.cron === "0 2 * * *") {
      // PSD → Sanity player/team/staff sync
      const layer = Layer.mergeAll(
        PsdTeamClientLive,
        SanityWriteClientLive,
        SanityProjectionLive,
        envLayer,
      ).pipe(Layer.provide(KvCacheLive), Layer.provide(envLayer));
      ctx.waitUntil(
        Effect.runPromise(Effect.provide(runSync, layer)).catch((e) => {
          console.error(
            "[scheduled] psd-sanity-sync failed:",
            String(e),
            e instanceof Error ? e.stack : "",
          );
          throw e;
        }),
      );
    } else {
      await Effect.runPromise(
        Effect.logWarning(`[scheduled] unknown cron expression: ${event.cron}`),
      );
    }
  },
};
