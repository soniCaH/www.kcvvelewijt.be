import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { VectorizeService, VectorizeServiceLive } from "./vectorize";
import { WorkerEnvTag } from "../env";

function makeVectorizeMock(
  overrides: Partial<VectorizeIndex> = {},
): VectorizeIndex {
  return {
    upsert: async () => ({ mutationId: "mut-123", count: 1 }),
    query: async () => ({
      matches: [
        {
          id: "doc-abc",
          score: 0.95,
          metadata: {
            slug: "kantine",
            type: "responsibilityPath",
            title: "Kantine",
            excerpt: "De kantine...",
          },
        },
      ],
    }),
    ...overrides,
  } as unknown as VectorizeIndex;
}

function makeEnvLayer(index: VectorizeIndex) {
  return Layer.succeed(WorkerEnvTag, {
    AI: {} as Ai,
    SEARCH_INDEX: index,
    PSD_API_BASE_URL: "",
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

describe("VectorizeService", () => {
  it("upserts vectors without error", async () => {
    const layer = VectorizeServiceLive.pipe(
      Layer.provide(makeEnvLayer(makeVectorizeMock())),
    );

    await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* VectorizeService;
        yield* svc.upsert([
          {
            id: "doc-abc",
            values: Array(768).fill(0.1),
            metadata: {
              slug: "kantine",
              type: "responsibilityPath",
              title: "Kantine",
              excerpt: "De kantine...",
            },
          },
        ]);
      }).pipe(Effect.provide(layer)),
    );
  });

  it("returns query matches with score and metadata", async () => {
    const layer = VectorizeServiceLive.pipe(
      Layer.provide(makeEnvLayer(makeVectorizeMock())),
    );

    const matches = await Effect.runPromise(
      Effect.gen(function* () {
        const svc = yield* VectorizeService;
        return yield* svc.query(Array(768).fill(0.1), {
          topK: 5,
          returnMetadata: "all",
        });
      }).pipe(Effect.provide(layer)),
    );

    expect(matches).toHaveLength(1);
    expect(matches[0]!.score).toBe(0.95);
    expect(matches[0]!.metadata?.["slug"]).toBe("kantine");
  });
});
