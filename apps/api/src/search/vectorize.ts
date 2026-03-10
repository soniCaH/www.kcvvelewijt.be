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
            return result.matches.map((m) => ({
              id: m.id,
              score: m.score,
              metadata: m.metadata as Record<string, string> | undefined,
            }));
          },
          catch: (cause) =>
            new VectorizeError(
              `Vectorize query failed: ${String(cause)}`,
              cause,
            ),
        }),
    };
  }),
);
