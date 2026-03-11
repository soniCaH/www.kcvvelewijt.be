import { Context, Effect, Layer } from "effect";
import { WorkerEnvTag } from "../env";

export class EmbeddingError extends Error {
  readonly _tag = "EmbeddingError" as const;
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

export interface EmbeddingServiceInterface {
  readonly embed: (text: string) => Effect.Effect<number[], EmbeddingError>;
}

export class EmbeddingService extends Context.Tag("EmbeddingService")<
  EmbeddingService,
  EmbeddingServiceInterface
>() {}

// bge-m3: multilingual (100+ languages incl. Dutch), 1024 dims, cosine
const MODEL = "@cf/baai/bge-m3";
const EXPECTED_DIMS = 1024;

export const EmbeddingServiceLive = Layer.effect(
  EmbeddingService,
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;
    return {
      embed: (text: string) =>
        Effect.tryPromise({
          try: async () => {
            // Cast needed: bge-m3 isn't in the AiModels type yet
            const ai = env.AI as unknown as {
              run: (model: string, input: unknown) => Promise<unknown>;
            };
            const result = (await ai.run(MODEL, { text: [text] })) as {
              data: number[][];
            };
            const vector = result.data[0];
            if (!vector) throw new Error("Empty embedding response");
            if (
              !Array.isArray(vector) ||
              vector.length !== EXPECTED_DIMS ||
              typeof vector[0] !== "number"
            ) {
              throw new Error(
                `Unexpected embedding shape: expected ${EXPECTED_DIMS}-dim number[], got ${Array.isArray(vector) ? `${vector.length}-dim ${typeof vector[0]}[]` : typeof vector}`,
              );
            }
            return vector;
          },
          catch: (cause) =>
            new EmbeddingError(`Failed to embed text: ${String(cause)}`, cause),
        }),
    };
  }),
);
