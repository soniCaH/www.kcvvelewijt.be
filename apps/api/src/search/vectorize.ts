import { Context, Effect, Layer, Schedule } from "effect";
import { WorkerEnvTag } from "../env";
import { readManifest, writeManifest } from "./index-manifest";

export class VectorizeError extends Error {
  readonly _tag = "VectorizeError" as const;
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

export interface VectorRecord {
  id: string;
  values: number[];
  metadata: Record<string, string>;
}

export interface VectorizeMatch {
  id: string;
  score: number;
  metadata?: Record<string, string>;
}

export interface VectorizeServiceInterface {
  readonly upsert: (
    vectors: VectorRecord[],
  ) => Effect.Effect<void, VectorizeError>;
  readonly query: (
    vector: number[],
    options: {
      topK: number;
      returnMetadata: "all" | "none";
      filter?: Record<string, string>;
    },
  ) => Effect.Effect<VectorizeMatch[], VectorizeError>;
  readonly getByIds: (
    ids: string[],
  ) => Effect.Effect<VectorRecord[], VectorizeError>;
  readonly deleteByIds: (ids: string[]) => Effect.Effect<void, VectorizeError>;
}

export class VectorizeService extends Context.Tag("VectorizeService")<
  VectorizeService,
  VectorizeServiceInterface
>() {}

// Retries a transient manifest KV op before giving up on it — same shape as
// sanity-index-sync.ts's UPSERT_RETRY, duplicated rather than shared: this
// module must not import from a caller of VectorizeService, and unifying
// retry shapes across the codebase is #2854 territory, not this one.
const MANIFEST_RETRY = Schedule.exponential("100 millis").pipe(
  Schedule.jittered,
  Schedule.intersect(Schedule.recurs(3)),
);

export const VectorizeServiceLive = Layer.effect(
  VectorizeService,
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;
    const kv = env.PSD_CACHE;
    const dataset = env.SANITY_DATASET;

    /**
     * The manifest write side of #2855: this is the **only** place that
     * writes `index-manifest.ts`'s manifest. `upsert` calls this with the
     * ids it just confirmed adding; `deleteByIds` calls it with the ids it
     * just confirmed removing. Never called for an id whose Vectorize call
     * failed — `upsert`/`deleteByIds` below only reach this via a `tap` on
     * the success channel of the underlying call, so a failure (even after
     * every retry a caller like the nightly sweep wraps around this
     * service) never touches the manifest.
     *
     * Best-effort like the `addToManifest` mechanism it replaces: retries a
     * transient KV error, then gives up and logs rather than failing the
     * caller — a KV blip must not turn a confirmed index write into a
     * failed upsert/delete response.
     *
     * Read-modify-write against one shared array, not a race-free per-id
     * marker: within one sweep, every call into this is already sequential
     * (`upsertBatched`/`deleteBatched` run chunks at concurrency 1), so the
     * only remaining exposure is a webhook call landing mid-sweep, or two
     * webhooks landing at the same instant — accepted for now per #2855's
     * scope (manifest growth, not manifest races, was the concern this
     * issue was filed to fix structurally).
     */
    const updateManifest = (
      label: string,
      apply: (current: readonly string[]) => readonly string[],
    ): Effect.Effect<void> =>
      readManifest(kv, dataset).pipe(
        Effect.flatMap((current) => writeManifest(kv, dataset, apply(current))),
        Effect.retry(MANIFEST_RETRY),
        Effect.catchAll((e) =>
          Effect.logError(
            `[vectorize] giving up on manifest ${label} after retries: ${String(e)}`,
          ),
        ),
      );

    const addToManifest = (ids: readonly string[]): Effect.Effect<void> =>
      ids.length === 0
        ? Effect.void
        : updateManifest("addition", (current) => [
            ...new Set([...current, ...ids]),
          ]);

    const removeFromManifest = (ids: readonly string[]): Effect.Effect<void> =>
      ids.length === 0
        ? Effect.void
        : updateManifest("removal", (current) => {
            const drop = new Set(ids);
            return current.filter((id) => !drop.has(id));
          });

    return {
      upsert: (vectors) =>
        Effect.tryPromise({
          try: () => env.SEARCH_INDEX.upsert(vectors).then(() => undefined),
          catch: (cause) =>
            new VectorizeError(
              `Vectorize upsert failed: ${String(cause)}`,
              cause,
            ),
        }).pipe(Effect.tap(() => addToManifest(vectors.map((v) => v.id)))),

      query: (vector, options) =>
        Effect.tryPromise({
          try: async () => {
            const result = await env.SEARCH_INDEX.query(vector, options);
            return result.matches.map((m) => {
              const rawMeta = m.metadata as
                Record<string, unknown> | null | undefined;
              if (rawMeta == null) {
                return { id: m.id, score: m.score };
              }
              const metadata: Record<string, string> = {};
              for (const [key, value] of Object.entries(rawMeta)) {
                if (typeof value === "string") metadata[key] = value;
              }
              if (Object.keys(metadata).length === 0) {
                return { id: m.id, score: m.score };
              }
              return { id: m.id, score: m.score, metadata };
            });
          },
          catch: (cause) =>
            new VectorizeError(
              `Vectorize query failed: ${String(cause)}`,
              cause,
            ),
        }),

      getByIds: (ids) =>
        Effect.tryPromise({
          try: async () => {
            const results = await env.SEARCH_INDEX.getByIds(ids);
            return results.map((r) => ({
              id: r.id,
              values: ArrayBuffer.isView(r.values)
                ? Array.from(r.values as Float32Array)
                : (r.values as number[]),
              metadata: (r.metadata ?? {}) as Record<string, string>,
            }));
          },
          catch: (cause) =>
            new VectorizeError(
              `Vectorize getByIds failed: ${String(cause)}`,
              cause,
            ),
        }),

      deleteByIds: (ids) =>
        Effect.tryPromise({
          try: () => env.SEARCH_INDEX.deleteByIds(ids).then(() => undefined),
          catch: (cause) =>
            new VectorizeError(
              `Vectorize deleteByIds failed: ${String(cause)}`,
              cause,
            ),
        }).pipe(Effect.tap(() => removeFromManifest(ids))),
    };
  }),
);
