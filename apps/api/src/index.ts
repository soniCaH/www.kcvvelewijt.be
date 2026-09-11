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
import { PsdServiceLive } from "./psd/service";
import { PsdGateLive } from "./psd/gate";
import { BackgroundRunnerLive } from "./psd/background-live";
import { KvCacheLive } from "./cache/kv-cache";
import { MatchesApiLive } from "./handlers/matches";
import { OpponentApiLive } from "./handlers/opponent";
import { RankingApiLive } from "./handlers/ranking";
import { RelatedApiLive } from "./handlers/related";
import { SearchApiLive } from "./handlers/search";
import { FormsApiLive } from "./handlers/forms";
import { EmailTransportLive } from "./email/resend";
import { EmbeddingServiceLive } from "./search/embedding";
import { VectorizeServiceLive } from "./search/vectorize";
import { AiAnswerServiceLive } from "./search/ai-answer";
import { runSanityIndexSync } from "./search/sanity-index-sync";
import { SanityMutationLive } from "./sanity/mutation";
import { SanityProjectionLive } from "./sanity/projection";
import { runSync } from "./sync/psd-sanity-sync";
import { handleIndexWebhook } from "./webhooks/index-handler";
import { reportScheduledJobOutcome } from "./psd/job-alert";

// The PSD gate Durable Object must be exported from the worker entry (the
// `main` module) for Cloudflare to bind it — see wrangler.toml [[durable_objects]].
export { PsdGate } from "./psd/gate-do";

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
function buildAppLayer(env: WorkerEnv, ctx: ExecutionContext) {
  return HttpApiBuilder.api(PsdApi).pipe(
    Layer.provide(MatchesApiLive),
    Layer.provide(OpponentApiLive),
    Layer.provide(RankingApiLive),
    Layer.provide(RelatedApiLive),
    Layer.provide(SearchApiLive),
    Layer.provide(FormsApiLive),
    Layer.provide(EmailTransportLive),
    Layer.provide(EmbeddingServiceLive),
    Layer.provide(VectorizeServiceLive),
    Layer.provide(AiAnswerServiceLive),
    Layer.provide(PsdServiceLive),
    // Global PSD gate (token bucket + single-flight) and the SWR background
    // runner that keeps the read path fresh without storming PSD (#2328).
    Layer.provide(PsdGateLive),
    Layer.provide(BackgroundRunnerLive(env, ctx)),
    Layer.provide(SanityProjectionLive),
    Layer.provide(SanityMutationLive),
    Layer.provide(KvCacheLive),
    Layer.provide(Layer.succeed(WorkerEnvTag, env)),
    Layer.provideMerge(WorkerPlatformLayer),
  );
}

export default {
  async fetch(
    request: Request,
    env: WorkerEnv,
    ctx: ExecutionContext,
  ): Promise<Response> {
    // Webhook routes use Effect internally but keep raw Request/Response entry point
    if (
      request.method === "POST" &&
      new URL(request.url).pathname === "/webhooks/index"
    ) {
      try {
        return await handleIndexWebhook(request, env, undefined, ctx);
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
      buildAppLayer(env, ctx),
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

    // Debounced Slack failure/recovery signal for both nightly crons (#2870).
    // Deliberately independent of PsdGateLive/IncidentTracker — see the
    // "scheduled-job failures" rule in apps/api/CLAUDE.md and
    // psd/job-alert.ts's doc comment. Additive: it never replaces the
    // console.error below, and it no-ops silently without
    // SLACK_ALERT_WEBHOOK_URL (staging).
    const jobAlertLayer = Layer.mergeAll(KvCacheLive, envLayer).pipe(
      Layer.provide(envLayer),
    );
    const reportJobOutcome = (
      job: string,
      outcome:
        { readonly ok: true } | { readonly ok: false; readonly error: unknown },
    ) =>
      Effect.runPromise(
        reportScheduledJobOutcome(job, outcome).pipe(
          Effect.provide(jobAlertLayer),
        ),
      );

    if (event.cron === "30 2 * * *") {
      // Search embedding index sync — separate invocation budget. Its
      // reconciliation step (#2831) reads/writes its id manifest via the
      // PSD_CACHE binding directly (env, already in envLayer) rather than
      // through KvCacheService.
      const layer = Layer.mergeAll(
        EmbeddingServiceLive,
        VectorizeServiceLive,
        envLayer,
      ).pipe(Layer.provide(envLayer));
      ctx.waitUntil(
        Effect.runPromise(Effect.provide(runSanityIndexSync(), layer))
          .then(() => reportJobOutcome("sanity-index-sync", { ok: true }))
          .catch(async (e) => {
            console.error(
              "[scheduled] sanity-index-sync failed:",
              String(e),
              e instanceof Error ? e.stack : "",
            );
            await reportJobOutcome("sanity-index-sync", {
              ok: false,
              error: e,
            });
            throw e;
          }),
      );
    } else if (event.cron === "0 2 * * *") {
      // PSD → Sanity player/team/staff sync
      const layer = Layer.mergeAll(
        PsdTeamClientLive,
        SanityMutationLive,
        SanityProjectionLive,
        envLayer,
      ).pipe(
        // PsdGateLive paces this job's PSD calls against the same global ≤5/s
        // budget the request path uses — without it the nightly fan-out is
        // unmetered. Pacing only: PSD incident alerting (IncidentTracker /
        // gate.reportOutcome) still does not cover this path (see the note in
        // sync/psd-team-client.ts) — that gap is deliberate, not this one.
        // The separate job-failure signal below (#2870) is independent of it.
        Layer.provide(PsdGateLive),
        Layer.provide(KvCacheLive),
        Layer.provide(envLayer),
      );
      // Awaited, not ctx.waitUntil() (#2900). waitUntil() only buys the ~30s
      // Cloudflare grants after the invocation would otherwise end — nowhere
      // near enough for a team whose photos all changed (four runs, ~30s
      // each, to sync one team — see the issue). Awaiting here keeps the
      // invocation itself alive for the sync's duration, so the real ceiling
      // becomes the Workers Paid plan's Cron Trigger wall-clock limit — 15
      // minutes for this daily (>= 1h interval) cron — not a 30s afterthought.
      // Measured, not assumed: the log line below records actual wall-clock
      // per run; see the PR for before/after numbers.
      // https://developers.cloudflare.com/workers/platform/limits/
      const syncStartedAt = Date.now();
      try {
        await Effect.runPromise(Effect.provide(runSync, layer));
        await reportJobOutcome("psd-sanity-sync", { ok: true });
      } catch (e) {
        console.error(
          "[scheduled] psd-sanity-sync failed:",
          String(e),
          e instanceof Error ? e.stack : "",
        );
        await reportJobOutcome("psd-sanity-sync", { ok: false, error: e });
        throw e;
      } finally {
        console.log(
          `[scheduled] psd-sanity-sync wall-clock: ${Date.now() - syncStartedAt}ms`,
        );
      }
    } else {
      await Effect.runPromise(
        Effect.logWarning(`[scheduled] unknown cron expression: ${event.cron}`),
      );
    }
  },
};
