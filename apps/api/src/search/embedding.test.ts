import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { EmbeddingService, EmbeddingServiceLive } from "./embedding";
import { WorkerEnvTag } from "../env";

function makeAiMock(runFn?: () => Promise<unknown>): Ai {
  return {
    run: runFn ?? (async () => ({ data: [Array(1024).fill(0.1)] })),
  } as unknown as Ai;
}

function makeEnvLayer(ai: Ai) {
  return Layer.succeed(WorkerEnvTag, {
    AI: ai,
    SEARCH_INDEX: {} as VectorizeIndex,
    PSD_API_BASE_URL: "",
    PSD_IMAGE_BASE_URL: "",
    FOOTBALISTO_LOGO_CDN_URL: "",
    PSD_API_KEY: "",
    PSD_API_CLUB: "",
    PSD_API_AUTH: "",
    PSD_CACHE: {} as KVNamespace,
    SANITY_PROJECT_ID: "",
    SANITY_DATASET: "",
    SANITY_API_TOKEN: "",
  });
}

describe("EmbeddingService", () => {
  it("returns a 1024-dimensional float array", async () => {
    const layer = EmbeddingServiceLive.pipe(
      Layer.provide(makeEnvLayer(makeAiMock())),
    );

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* EmbeddingService;
        return yield* svc.embed("wie regelt de kantine");
      }).pipe(Effect.provide(layer)),
    );

    expect(result).toHaveLength(1024);
    expect(typeof result[0]).toBe("number");
  });

  it("propagates AI errors as EmbeddingError", async () => {
    const failingAi = makeAiMock(async () => {
      throw new Error("AI unavailable");
    });
    const layer = EmbeddingServiceLive.pipe(
      Layer.provide(makeEnvLayer(failingAi)),
    );

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* EmbeddingService;
        return yield* svc.embed("test").pipe(Effect.either);
      }).pipe(Effect.provide(layer)),
    );

    expect(result._tag).toBe("Left");
  });
});
