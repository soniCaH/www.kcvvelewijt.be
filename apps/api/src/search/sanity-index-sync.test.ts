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

const mockArticle = {
  _id: "article-001",
  slug: "kcvv-wint-derby",
  title: "KCVV wint derby",
  tags: ["verslag", "derby"],
  bodyText: "KCVV Elewijt won de derby met 3-1.",
  imageUrl: null as string | null,
};

const mockPage = {
  _id: "page-001",
  slug: "over-kcvv",
  title: "Over KCVV Elewijt",
  bodyText: "KCVV Elewijt is een voetbalclub uit Elewijt.",
};

function makeEnvLayer() {
  return Layer.succeed(WorkerEnvTag, {
    AI: {} as Ai,
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
    SANITY_WEBHOOK_SECRET: "",
  });
}

function makeEmbeddingMock(): EmbeddingServiceInterface {
  return { embed: () => Effect.succeed(FAKE_VECTOR) };
}

function makeVectorizeCapture() {
  const upsertCalls: VectorRecord[][] = [];
  const mock: VectorizeServiceInterface = {
    upsert: (vectors) =>
      Effect.sync(() => {
        upsertCalls.push(vectors);
      }),
    query: () => Effect.succeed([]),
    getByIds: () => Effect.succeed([]),
  };
  return { upsertCalls, mock };
}

function noopFetch<T>(data: T[]) {
  return async () => data;
}

describe("runSanityIndexSync", () => {
  it("embeds and upserts each responsibility path with correct metadata", async () => {
    const { upsertCalls, mock } = makeVectorizeCapture();

    await Effect.runPromise(
      runSanityIndexSync({
        fetchResponsibility: noopFetch([mockDoc]),
      }).pipe(
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(EmbeddingService, makeEmbeddingMock())),
        Effect.provide(Layer.succeed(VectorizeService, mock)),
      ),
    );

    const upserted = upsertCalls.flat();
    const doc = upserted.find((v) => v.id === "sanity-abc-123");
    expect(doc).toBeDefined();
    expect(doc!.metadata["slug"]).toBe("kantine-evenementen");
    expect(doc!.metadata["type"]).toBe("responsibility");
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
      runSanityIndexSync({
        fetchResponsibility: noopFetch([mockDoc]),
      }).pipe(
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(EmbeddingService, captureEmbed)),
        Effect.provide(
          Layer.succeed(VectorizeService, {
            upsert: () => Effect.succeed(undefined),
            query: () => Effect.succeed([]),
            getByIds: () => Effect.succeed([]),
          }),
        ),
      ),
    );

    const text = embeddedTexts[0]!;
    expect(text).toContain("Kantine");
    expect(text).toContain("wie regelt de kantine");
    expect(text).toContain("kantine bar evenementen");
  });

  it("indexes articles with correct metadata", async () => {
    const { upsertCalls, mock } = makeVectorizeCapture();

    await Effect.runPromise(
      runSanityIndexSync({
        fetchResponsibility: noopFetch([]),
        fetchArticles: noopFetch([mockArticle]),
        fetchPages: noopFetch([]),
      }).pipe(
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(EmbeddingService, makeEmbeddingMock())),
        Effect.provide(Layer.succeed(VectorizeService, mock)),
      ),
    );

    const upserted = upsertCalls.flat();
    const doc = upserted.find((v) => v.id === "article-001");
    expect(doc).toBeDefined();
    expect(doc!.metadata["slug"]).toBe("kcvv-wint-derby");
    expect(doc!.metadata["type"]).toBe("article");
    expect(doc!.metadata["title"]).toBe("KCVV wint derby");
    expect(doc!.metadata["excerpt"]).toBe("KCVV Elewijt won de derby met 3-1.");
    expect(doc!.metadata["imageUrl"]).toBeUndefined();
  });

  it("stores imageUrl in article metadata when present", async () => {
    const { upsertCalls, mock } = makeVectorizeCapture();

    await Effect.runPromise(
      runSanityIndexSync({
        fetchResponsibility: noopFetch([]),
        fetchArticles: noopFetch([
          {
            ...mockArticle,
            imageUrl: "https://cdn.example.com/cover.jpg",
          },
        ]),
        fetchPages: noopFetch([]),
      }).pipe(
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(EmbeddingService, makeEmbeddingMock())),
        Effect.provide(Layer.succeed(VectorizeService, mock)),
      ),
    );

    const upserted = upsertCalls.flat();
    const doc = upserted.find((v) => v.id === "article-001");
    expect(doc!.metadata["imageUrl"]).toBe("https://cdn.example.com/cover.jpg");
  });

  it("omits imageUrl from article metadata when null", async () => {
    const { upsertCalls, mock } = makeVectorizeCapture();

    await Effect.runPromise(
      runSanityIndexSync({
        fetchResponsibility: noopFetch([]),
        fetchArticles: noopFetch([{ ...mockArticle, imageUrl: null }]),
        fetchPages: noopFetch([]),
      }).pipe(
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(EmbeddingService, makeEmbeddingMock())),
        Effect.provide(Layer.succeed(VectorizeService, mock)),
      ),
    );

    const upserted = upsertCalls.flat();
    const doc = upserted.find((v) => v.id === "article-001");
    expect(doc!.metadata["imageUrl"]).toBeUndefined();
  });

  it("indexes pages with correct metadata", async () => {
    const { upsertCalls, mock } = makeVectorizeCapture();

    await Effect.runPromise(
      runSanityIndexSync({
        fetchResponsibility: noopFetch([]),
        fetchArticles: noopFetch([]),
        fetchPages: noopFetch([mockPage]),
      }).pipe(
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(EmbeddingService, makeEmbeddingMock())),
        Effect.provide(Layer.succeed(VectorizeService, mock)),
      ),
    );

    const upserted = upsertCalls.flat();
    const doc = upserted.find((v) => v.id === "page-001");
    expect(doc).toBeDefined();
    expect(doc!.metadata["slug"]).toBe("over-kcvv");
    expect(doc!.metadata["type"]).toBe("page");
    expect(doc!.metadata["title"]).toBe("Over KCVV Elewijt");
  });

  it("indexes articles with null body gracefully", async () => {
    const { upsertCalls, mock } = makeVectorizeCapture();
    const articleNoBody = {
      ...mockArticle,
      _id: "article-no-body",
      bodyText: null,
    };

    await Effect.runPromise(
      runSanityIndexSync({
        fetchResponsibility: noopFetch([]),
        fetchArticles: noopFetch([articleNoBody]),
        fetchPages: noopFetch([]),
      }).pipe(
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(EmbeddingService, makeEmbeddingMock())),
        Effect.provide(Layer.succeed(VectorizeService, mock)),
      ),
    );

    const upserted = upsertCalls.flat();
    const doc = upserted.find((v) => v.id === "article-no-body");
    expect(doc).toBeDefined();
    expect(doc!.metadata["excerpt"]).toBe("");
  });

  it("continues indexing when article fetch fails", async () => {
    const { upsertCalls, mock } = makeVectorizeCapture();

    await Effect.runPromise(
      runSanityIndexSync({
        fetchResponsibility: noopFetch([mockDoc]),
        fetchArticles: async () => {
          throw new Error("Sanity timeout");
        },
        fetchPages: noopFetch([mockPage]),
      }).pipe(
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(EmbeddingService, makeEmbeddingMock())),
        Effect.provide(Layer.succeed(VectorizeService, mock)),
      ),
    );

    const upserted = upsertCalls.flat();
    // Responsibility paths and pages should still be indexed
    expect(upserted.find((v) => v.id === "sanity-abc-123")).toBeDefined();
    expect(upserted.find((v) => v.id === "page-001")).toBeDefined();
  });

  it("continues indexing when page fetch fails", async () => {
    const { upsertCalls, mock } = makeVectorizeCapture();

    await Effect.runPromise(
      runSanityIndexSync({
        fetchResponsibility: noopFetch([mockDoc]),
        fetchArticles: noopFetch([mockArticle]),
        fetchPages: async () => {
          throw new Error("Sanity timeout");
        },
      }).pipe(
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(EmbeddingService, makeEmbeddingMock())),
        Effect.provide(Layer.succeed(VectorizeService, mock)),
      ),
    );

    const upserted = upsertCalls.flat();
    expect(upserted.find((v) => v.id === "sanity-abc-123")).toBeDefined();
    expect(upserted.find((v) => v.id === "article-001")).toBeDefined();
  });
});
