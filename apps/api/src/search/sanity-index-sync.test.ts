import { describe, it, expect } from "vitest";
import { Effect, Exit, Layer, Logger } from "effect";
import { runSanityIndexSync } from "./sanity-index-sync";
import {
  EmbeddingError,
  EmbeddingService,
  type EmbeddingServiceInterface,
} from "./embedding";
import {
  VectorizeError,
  VectorizeService,
  type VectorizeServiceInterface,
  type VectorRecord,
} from "./vectorize";
import { WorkerEnvTag, type WorkerEnv } from "../env";

const FAKE_VECTOR = Array(1024).fill(0.1);

const mockDoc = {
  _id: "sanity-abc-123",
  slug: "kantine-evenementen",
  title: "Kantine & evenementen",
  question: "wie regelt de kantine",
  keywords: ["kantine", "bar", "evenementen"],
  summary: "De kantine wordt beheerd door de evenementencommissie.",
};

const mockArticle = {
  _id: "article-001",
  slug: "kcvv-wint-derby",
  title: "KCVV wint derby",
  tags: ["verslag", "derby"],
  lead: "Een late kopbal besliste de derby.",
  prose: "KCVV Elewijt won de derby met 3-1.",
  qaQuestions: [] as string[],
  qaAnswers: "",
  tableHtml: [] as string[],
  imageUrl: null as string | null,
};

const mockPage = {
  _id: "page-001",
  slug: "over-kcvv",
  title: "Over KCVV Elewijt",
  bodyText: "KCVV Elewijt is een voetbalclub uit Elewijt.",
  fileAttachmentLabels: [] as string[],
};

function makeEnvLayer(overrides: Partial<WorkerEnv> = {}) {
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
    PSD_GATE: {} as DurableObjectNamespace,
    SANITY_PROJECT_ID: "",
    // Correctly-paired by default so every pre-existing test in this file
    // (not exercising the dataset/index guard) passes through it unaffected.
    SANITY_DATASET: "production",
    SEARCH_INDEX_NAME: "kcvv-search",
    SANITY_API_TOKEN: "",
    SANITY_WEBHOOK_SECRET: "",
    ...overrides,
  });
}

function makeEmbeddingMock(): EmbeddingServiceInterface {
  return { embed: () => Effect.succeed(FAKE_VECTOR) };
}

/**
 * Records every upsert batch. Each call yields to the macrotask queue so
 * overlapping calls are observable — `probe.maxInFlight` stays 1 only if the
 * batches really are upserted one at a time.
 */
function makeVectorizeCapture(overrides?: Partial<VectorizeServiceInterface>) {
  const upsertCalls: VectorRecord[][] = [];
  const probe = { inFlight: 0, maxInFlight: 0 };
  const mock: VectorizeServiceInterface = {
    upsert: (vectors) =>
      Effect.promise(async () => {
        probe.inFlight++;
        probe.maxInFlight = Math.max(probe.maxInFlight, probe.inFlight);
        await new Promise((resolve) => setTimeout(resolve, 0));
        probe.inFlight--;
        upsertCalls.push(vectors);
      }),
    query: () => Effect.succeed([]),
    getByIds: () => Effect.succeed([]),
    deleteByIds: () => Effect.succeed(undefined as void),
    ...overrides,
  };
  return { upsertCalls, probe, mock };
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
            deleteByIds: () => Effect.succeed(undefined as void),
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
    // The excerpt is the editor's lead, not a slice of the index text — that
    // blob now carries Q&A and table words behind the prose (#2806).
    expect(doc!.metadata["excerpt"]).toBe("Een late kopbal besliste de derby.");
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
      lead: "",
      prose: "",
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

  it("batches upserts per doc-type instead of once per document", async () => {
    const { upsertCalls, mock } = makeVectorizeCapture();

    await Effect.runPromise(
      runSanityIndexSync({
        fetchResponsibility: noopFetch([
          mockDoc,
          { ...mockDoc, _id: "resp-002" },
          { ...mockDoc, _id: "resp-003" },
        ]),
        fetchArticles: noopFetch([
          mockArticle,
          { ...mockArticle, _id: "article-002" },
        ]),
        fetchPages: noopFetch([mockPage, { ...mockPage, _id: "page-002" }]),
      }).pipe(
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(EmbeddingService, makeEmbeddingMock())),
        Effect.provide(Layer.succeed(VectorizeService, mock)),
      ),
    );

    // 7 documents, one batched upsert per doc-type
    expect(upsertCalls).toHaveLength(3);
    expect(upsertCalls.map((batch) => batch.length)).toEqual([3, 2, 2]);
  });

  it("chunks a batch above the 1000-vector cap and upserts the chunks sequentially", async () => {
    const { upsertCalls, probe, mock } = makeVectorizeCapture();
    const manyPages = Array.from({ length: 1001 }, (_, i) => ({
      ...mockPage,
      _id: `page-${i}`,
    }));

    await Effect.runPromise(
      runSanityIndexSync({
        fetchResponsibility: noopFetch([]),
        fetchArticles: noopFetch([]),
        fetchPages: noopFetch(manyPages),
      }).pipe(
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(EmbeddingService, makeEmbeddingMock())),
        Effect.provide(Layer.succeed(VectorizeService, mock)),
      ),
    );

    expect(upsertCalls.map((batch) => batch.length)).toEqual([1000, 1]);
    expect(probe.maxInFlight).toBe(1);
  });

  it("omits a document whose embedding fails and still upserts the rest", async () => {
    const { upsertCalls, mock } = makeVectorizeCapture();
    const flakyEmbed: EmbeddingServiceInterface = {
      embed: (text) =>
        text.includes("derby")
          ? Effect.fail(new EmbeddingError("Workers AI unavailable"))
          : Effect.succeed(FAKE_VECTOR),
    };

    await Effect.runPromise(
      runSanityIndexSync({
        fetchResponsibility: noopFetch([]),
        fetchArticles: noopFetch([
          mockArticle,
          {
            ...mockArticle,
            _id: "article-002",
            title: "Gelijkspel",
            tags: ["verslag"],
            lead: "Een puntendeling op bezoek.",
            prose: "KCVV Elewijt speelde 1-1 gelijk.",
          },
        ]),
        fetchPages: noopFetch([]),
      }).pipe(
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(EmbeddingService, flakyEmbed)),
        Effect.provide(Layer.succeed(VectorizeService, mock)),
      ),
    );

    const upserted = upsertCalls.flat();
    expect(upserted.map((v) => v.id)).toEqual(["article-002"]);
  });

  it("logs the dropped count and completes the run when a batch keeps failing", async () => {
    const messages: string[] = [];
    const TestLogger = Logger.make(({ message }) => {
      messages.push(String(message));
    });
    const { mock: failingVectorize } = makeVectorizeCapture({
      upsert: () => Effect.fail(new VectorizeError("40041 Too Many Requests")),
    });

    const exit = await Effect.runPromiseExit(
      runSanityIndexSync({
        fetchResponsibility: noopFetch([mockDoc]),
        fetchArticles: noopFetch([]),
        fetchPages: noopFetch([]),
      }).pipe(
        Effect.provide(makeEnvLayer()),
        Effect.provide(Layer.succeed(EmbeddingService, makeEmbeddingMock())),
        Effect.provide(Layer.succeed(VectorizeService, failingVectorize)),
        Effect.provide(Logger.replace(Logger.defaultLogger, TestLogger)),
      ),
    );

    expect(Exit.isSuccess(exit)).toBe(true);
    expect(
      messages.some((m) => m.includes("dropped 1 of 1") && m.includes("40041")),
    ).toBe(true);
    expect(
      messages.some((m) => m.includes("Indexed 0/1 responsibility paths")),
    ).toBe(true);
  });

  it("refuses to sync when the worker's dataset doesn't match its configured index", async () => {
    // Reproduces #2833 review finding 7: the bulk sync writes to the same
    // SEARCH_INDEX binding as the webhook but had no equivalent guard. It is
    // unreachable on staging today only because crons are [] there — the
    // same reasoning this issue was filed to retire for the webhook.
    const { upsertCalls, mock } = makeVectorizeCapture();

    const exit = await Effect.runPromiseExit(
      runSanityIndexSync({
        fetchResponsibility: noopFetch([mockDoc]),
      }).pipe(
        Effect.provide(
          makeEnvLayer({
            SANITY_DATASET: "staging",
            SEARCH_INDEX_NAME: "kcvv-search",
          }),
        ),
        Effect.provide(Layer.succeed(EmbeddingService, makeEmbeddingMock())),
        Effect.provide(Layer.succeed(VectorizeService, mock)),
      ),
    );

    expect(Exit.isFailure(exit)).toBe(true);
    expect(upsertCalls).toHaveLength(0);
  });
});
