import { Context, Effect, Layer } from "effect";
import { WorkerEnvTag } from "../env";
import { addToManifest } from "./index-manifest";

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

export const VectorizeServiceLive = Layer.effect(
  VectorizeService,
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;
    const kv = env.PSD_CACHE;
    const dataset = env.SANITY_DATASET;

    /**
     * The manifest ADD side of #2855: this is the only place `upsert`'s
     * confirmed ids get recorded, so a caller cannot write the index
     * without a marker following — structural, not a second call site a
     * future caller could forget (the webhook used to make this call
     * itself; now every caller inherits it for free).
     *
     * Deliberately still the put-only per-id marker (`addToManifest`,
     * `index-manifest.ts`) rather than a read-modify-write against the
     * shared manifest array: Workers KV is eventually consistent (a `get`
     * can serve a stale value for up to 60s after a `put`) and throttles a
     * single key to ~1 write/sec. A read-modify-write here would run at
     * least once per upsert *batch* — several times inside one sweep, plus
     * once per concurrent webhook — so two callers racing the same shared
     * key would silently lose one another's additions, exactly the defect
     * #2856 fixed by giving every id its own write-only key with nothing to
     * race on. Folding those markers into the manifest array stays the
     * nightly sweep's job (`sanity-index-sync.ts`) — it is still the
     * array's only writer, running once, sequentially, per invocation.
     *
     * The delete side is NOT symmetric on purpose: `deleteByIds` below does
     * not touch the manifest at all. Pre-#2855, a webhook delete never
     * updated the manifest either — the array only ever drops an id via the
     * sweep's own confirmed-delete reconciliation, and that was already the
     * manifest's only removal path, so there was no second call site to
     * consolidate for deletes. Adding a parallel "pending delete" marker
     * here would be new complexity #2855 didn't ask for, not a fix for
     * anything broken — see apps/api/CLAUDE.md.
     */
    const recordUpsertedIds = (ids: readonly string[]): Effect.Effect<void> =>
      Effect.forEach(ids, (id) => addToManifest(kv, dataset, id), {
        concurrency: 5,
        discard: true,
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
        }).pipe(Effect.tap(() => recordUpsertedIds(vectors.map((v) => v.id)))),

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

      // No manifest interaction here — see the docblock above
      // `recordUpsertedIds`. Only the nightly sweep's reconciliation step
      // removes a confirmed-deleted id from the manifest array.
      deleteByIds: (ids) =>
        Effect.tryPromise({
          try: () => env.SEARCH_INDEX.deleteByIds(ids).then(() => undefined),
          catch: (cause) =>
            new VectorizeError(
              `Vectorize deleteByIds failed: ${String(cause)}`,
              cause,
            ),
        }),
    };
  }),
);
