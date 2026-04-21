import { Context, Effect, Layer } from "effect";
import { WorkerEnvTag } from "../env";

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
    return {
      upsert: (vectors) =>
        Effect.tryPromise({
          try: () => env.SEARCH_INDEX.upsert(vectors).then(() => undefined),
          catch: (cause) =>
            new VectorizeError(
              `Vectorize upsert failed: ${String(cause)}`,
              cause,
            ),
        }),

      query: (vector, options) =>
        Effect.tryPromise({
          try: async () => {
            const result = await env.SEARCH_INDEX.query(vector, options);
            return result.matches.map((m) => {
              const rawMeta = m.metadata as
                | Record<string, unknown>
                | null
                | undefined;
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
        }),
    };
  }),
);
