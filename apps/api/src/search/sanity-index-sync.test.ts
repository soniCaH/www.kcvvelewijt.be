import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { runSanityIndexSync } from "./sanity-index-sync";
import { EmbeddingService, type EmbeddingServiceInterface } from "./embedding";
import {
  VectorizeService,
  type VectorizeServiceInterface,
  type VectorRecord,
} from "./vectorize";
import { WorkerEnvTag } from "../env";

const FAKE_VECTOR = Array(1024).fill(0.1);

const mockDoc = {
  _id: "sanity-abc-123",
  slug: "kantine-evenementen",
  title: "Kantine & evenementen",
  question: "wie regelt de kantine",
  keywords: ["kantine", "bar", "evenementen"],
  summary: "De kantine wordt beheerd door de evenementencommissie.",
  category: "algemeen",
};

function makeEnvLayer() {
  return Layer.succeed(WorkerEnvTag, {
    AI: {} as Ai,
    SEARCH_INDEX: {} as VectorizeIndex,
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

function makeEmbeddingMock(): EmbeddingServiceInterface {
  return { embed: () => Effect.succeed(FAKE_VECTOR) };
}

describe("runSanityIndexSync", () => {
  it("embeds and upserts each responsibility path with correct metadata", async () => {
    const upsertCalls: VectorRecord[][] = [];
    const vectorizeMock: VectorizeServiceInterface = {
      upsert: (vectors) =>
        Effect.sync(() => {
          upsertCalls.push(vectors);
        }),
      query: () => Effect.succeed([]),
    };

    await Effect.runPromise(
      runSanityIndexSync(async () => [mockDoc]).pipe(
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(EmbeddingService, makeEmbeddingMock())),
        Effect.provide(Layer.succeed(VectorizeService, vectorizeMock)),
      ),
    );

    const upserted = upsertCalls.flat();
    const doc = upserted.find((v) => v.id === "sanity-abc-123");
    expect(doc).toBeDefined();
    expect(doc!.metadata["slug"]).toBe("kantine-evenementen");
    expect(doc!.metadata["type"]).toBe("responsibilityPath");
    expect(doc!.values).toEqual(FAKE_VECTOR);
  });

  it("includes title + question + keywords in embedded text", async () => {
    const embeddedTexts: string[] = [];
    const captureEmbed: EmbeddingServiceInterface = {
      embed: (text) =>
        Effect.sync(() => {
          embeddedTexts.push(text);
          return FAKE_VECTOR;
        }),
    };

    await Effect.runPromise(
      runSanityIndexSync(async () => [mockDoc]).pipe(
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(EmbeddingService, captureEmbed)),
        Effect.provide(
          Layer.succeed(VectorizeService, {
            upsert: () => Effect.succeed(undefined),
            query: () => Effect.succeed([]),
          }),
        ),
      ),
    );

    const text = embeddedTexts[0]!;
    expect(text).toContain("Kantine");
    expect(text).toContain("wie regelt de kantine");
    expect(text).toContain("kantine bar evenementen");
  });
});
