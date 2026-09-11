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
import {
  addToManifest,
  listPendingIds,
  manifestKey,
  readManifest,
} from "./index-manifest";

const FAKE_VECTOR = Array(1024).fill(0.1);

const MANIFEST_KEY = manifestKey("production");

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
 * Records every upsert batch and every deleteByIds call. Each upsert call
 * yields to the macrotask queue so overlapping calls are observable —
 * `probe.maxInFlight` stays 1 only if the batches really are upserted one at
 * a time.
 */
function makeVectorizeCapture(overrides?: Partial<VectorizeServiceInterface>) {
  const upsertCalls: VectorRecord[][] = [];
  const deleteCalls: string[][] = [];
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
    deleteByIds: (ids) =>
      Effect.sync(() => {
        deleteCalls.push(ids);
      }),
    ...overrides,
  };
  return { upsertCalls, deleteCalls, probe, mock };
}

/**
 * Stateful, in-memory KVNamespace so a test can run sweeps back to back and
 * have each see the manifest (and any pending markers) the last one wrote —
 * real KV persists between scheduled invocations, `{} as KVNamespace` (the
 * env default) cannot exercise that. `get`/`put` are mutable properties so
 * a test can swap in a failing implementation for one sweep and restore it
 * afterward. `list` supports the `prefix` filter `listPendingIds` uses
 * (index-manifest.ts) — single page, `list_complete: true`, which is all a
 * test-scale marker count ever needs.
 */
function makeKvNamespaceMock(): KVNamespace & {
  readonly store: Map<string, string>;
} {
  const store = new Map<string, string>();
  const mock = {
    store,
    get: (async (key: string) => store.get(key) ?? null) as KVNamespace["get"],
    put: (async (key: string, value: string) => {
      store.set(key, value);
    }) as KVNamespace["put"],
    delete: (async (key: string) => {
      store.delete(key);
    }) as KVNamespace["delete"],
    list: (async (opts?: { prefix?: string }) => {
      const prefix = opts?.prefix ?? "";
      const keys = [...store.keys()]
        .filter((k) => k.startsWith(prefix))
        .map((name) => ({ name }));
      return {
        keys,
        list_complete: true,
        cursor: undefined,
        cacheStatus: null,
      };
    }) as KVNamespace["list"],
  };
  return mock as unknown as KVNamespace & {
    readonly store: Map<string, string>;
  };
}

function noopFetch<T>(data: T[]) {
  return async () => data;
}

/**
 * Runs one sweep with sensible defaults for every fetcher (all empty), so a
 * test only spells out the ones it cares about. Reduces every call site to
 * "what's different about this sweep" instead of re-listing all five
 * fetchers plus three provides every time.
 */
function sweep(
  options: Parameters<typeof runSanityIndexSync>[0],
  vectorize: VectorizeServiceInterface,
  envOverrides: Partial<WorkerEnv> = {},
) {
  return runSanityIndexSync({
    fetchResponsibility: noopFetch([]),
    fetchArticles: noopFetch([]),
    fetchPages: noopFetch([]),
    fetchExcludedResponsibilityIds: noopFetch([]),
    fetchExcludedArticleIds: noopFetch([]),
    ...options,
  }).pipe(
    Effect.provide(makeEnvLayer(envOverrides)),
    Effect.provide(Layer.succeed(EmbeddingService, makeEmbeddingMock())),
    Effect.provide(Layer.succeed(VectorizeService, vectorize)),
  );
}

describe("runSanityIndexSync", () => {
  it("embeds and upserts each responsibility path with correct metadata", async () => {
    const { upsertCalls, mock } = makeVectorizeCapture();

    await Effect.runPromise(
      sweep({ fetchResponsibility: noopFetch([mockDoc]) }, mock),
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
      sweep({ fetchArticles: noopFetch([mockArticle]) }, mock),
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
      sweep(
        {
          fetchArticles: noopFetch([
            { ...mockArticle, imageUrl: "https://cdn.example.com/cover.jpg" },
          ]),
        },
        mock,
      ),
    );

    const upserted = upsertCalls.flat();
    const doc = upserted.find((v) => v.id === "article-001");
    expect(doc!.metadata["imageUrl"]).toBe("https://cdn.example.com/cover.jpg");
  });

  it("omits imageUrl from article metadata when null", async () => {
    const { upsertCalls, mock } = makeVectorizeCapture();

    await Effect.runPromise(
      sweep(
        { fetchArticles: noopFetch([{ ...mockArticle, imageUrl: null }]) },
        mock,
      ),
    );

    const upserted = upsertCalls.flat();
    const doc = upserted.find((v) => v.id === "article-001");
    expect(doc!.metadata["imageUrl"]).toBeUndefined();
  });

  it("indexes pages with correct metadata", async () => {
    const { upsertCalls, mock } = makeVectorizeCapture();

    await Effect.runPromise(sweep({ fetchPages: noopFetch([mockPage]) }, mock));

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
      sweep({ fetchArticles: noopFetch([articleNoBody]) }, mock),
    );

    const upserted = upsertCalls.flat();
    const doc = upserted.find((v) => v.id === "article-no-body");
    expect(doc).toBeDefined();
    expect(doc!.metadata["excerpt"]).toBe("");
  });

  it("continues indexing when article fetch fails", async () => {
    const { upsertCalls, mock } = makeVectorizeCapture();

    await Effect.runPromise(
      sweep(
        {
          fetchResponsibility: noopFetch([mockDoc]),
          fetchArticles: async () => {
            throw new Error("Sanity timeout");
          },
          fetchPages: noopFetch([mockPage]),
        },
        mock,
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
      sweep(
        {
          fetchResponsibility: noopFetch([mockDoc]),
          fetchArticles: noopFetch([mockArticle]),
          fetchPages: async () => {
            throw new Error("Sanity timeout");
          },
        },
        mock,
      ),
    );

    const upserted = upsertCalls.flat();
    expect(upserted.find((v) => v.id === "sanity-abc-123")).toBeDefined();
    expect(upserted.find((v) => v.id === "article-001")).toBeDefined();
  });

  it("batches upserts per doc-type instead of once per document", async () => {
    const { upsertCalls, mock } = makeVectorizeCapture();

    await Effect.runPromise(
      sweep(
        {
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
        },
        mock,
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

    await Effect.runPromise(sweep({ fetchPages: noopFetch(manyPages) }, mock));

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

  it("logs the dropped count, still finishes the sweep, but reports the run as failed since nothing landed", async () => {
    const messages: string[] = [];
    const TestLogger = Logger.make(({ message }) => {
      messages.push(String(message));
    });
    const { mock: failingVectorize } = makeVectorizeCapture({
      upsert: () => Effect.fail(new VectorizeError("40041 Too Many Requests")),
    });

    const exit = await Effect.runPromiseExit(
      sweep(
        { fetchResponsibility: noopFetch([mockDoc]) },
        failingVectorize,
      ).pipe(Effect.provide(Logger.replace(Logger.defaultLogger, TestLogger))),
    );

    // Degradation still ran to completion (the drop is logged below) — but
    // the whole sweep landed 0 of the 1 document it attempted, which #2870's
    // review requires this to surface as a failure (previously this resolved
    // successfully, so the scheduled job's Slack signal called it healthy).
    expect(Exit.isSuccess(exit)).toBe(false);
    expect(
      messages.some((m) => m.includes("dropped 1 of 1") && m.includes("40041")),
    ).toBe(true);
    expect(
      messages.some((m) => m.includes("Indexed 0/1 responsibility paths")),
    ).toBe(true);
  });

  it("succeeds on a quiet night with nothing to index at all", async () => {
    const { mock } = makeVectorizeCapture();

    const exit = await Effect.runPromiseExit(sweep({}, mock));

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it("still succeeds when one phase is entirely dropped but another phase lands documents (#2870: only a TOTAL wipeout fails the run)", async () => {
    const { mock } = makeVectorizeCapture({
      // Fail only chunks that are all-responsibility; let article/page
      // chunks through, so one phase is a total loss while another lands.
      upsert: (chunk) =>
        chunk.every((v) => v.metadata["type"] === "responsibility")
          ? Effect.fail(new VectorizeError("40041 Too Many Requests"))
          : Effect.succeed(undefined),
    });

    const exit = await Effect.runPromiseExit(
      sweep(
        {
          fetchResponsibility: noopFetch([mockDoc]),
          fetchArticles: noopFetch([mockArticle]),
        },
        mock,
      ),
    );

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it("refuses to sync when the worker's dataset doesn't match its configured index", async () => {
    // Reproduces #2833: the bulk sync writes to the same SEARCH_INDEX
    // binding as the webhook but had no equivalent guard. It is unreachable
    // on staging today only because crons are [] there — the same reasoning
    // this issue was filed to retire for the webhook.
    const { upsertCalls, mock } = makeVectorizeCapture();

    const exit = await Effect.runPromiseExit(
      sweep({ fetchResponsibility: noopFetch([mockDoc]) }, mock, {
        SANITY_DATASET: "staging",
        SEARCH_INDEX_NAME: "kcvv-search",
      }),
    );

    expect(Exit.isFailure(exit)).toBe(true);
    expect(upsertCalls).toHaveLength(0);
  });

  describe("reconciliation (#2831) — pruning what no longer matches", () => {
    it("deletes the vector for a document that drops out of the query on the next sweep", async () => {
      const kv = makeKvNamespaceMock();

      // Sweep 1: indexed. No previous manifest exists yet, so nothing is
      // deleted.
      const { deleteCalls, mock: mock1 } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep({ fetchResponsibility: noopFetch([mockDoc]) }, mock1, {
          SEARCH_INDEX_PRUNE_DRY_RUN: "false",
          PSD_CACHE: kv,
        }),
      );
      expect(deleteCalls).toHaveLength(0);

      // Sweep 2: mockDoc went inactive (or was deleted) and no longer
      // matches RESPONSIBILITY_QUERY — the fetcher now omits it.
      const { deleteCalls: deleteCalls2, mock: mock2 } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep({}, mock2, {
          SEARCH_INDEX_PRUNE_DRY_RUN: "false",
          PSD_CACHE: kv,
        }),
      );

      expect(deleteCalls2.flat()).toEqual(["sanity-abc-123"]);
    });

    it("keeps a dropped id pending across a dry-run sweep and prunes it once the flag flips to false", async () => {
      const kv = makeKvNamespaceMock();

      // Sweep 1 (bootstrap): indexed.
      const { mock: mock1 } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep({ fetchResponsibility: noopFetch([mockDoc]) }, mock1, {
          PSD_CACHE: kv,
        }),
      );

      // Sweep 2: mockDoc drops out, but dry-run is on (the default) —
      // nothing is actually deleted. The manifest must not be overwritten
      // with (empty) currentIds regardless — that would silently lose
      // mockDoc from tracking.
      const { deleteCalls: deleteCalls2, mock: mock2 } = makeVectorizeCapture();
      await Effect.runPromise(sweep({}, mock2, { PSD_CACHE: kv }));
      expect(deleteCalls2).toHaveLength(0);

      // Sweep 3: same fetch result, dry-run flipped to "false". mockDoc must
      // still be prunable — it must not have fallen out of the manifest
      // during sweep 2's dry-run pass.
      const { deleteCalls: deleteCalls3, mock: mock3 } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep({}, mock3, {
          SEARCH_INDEX_PRUNE_DRY_RUN: "false",
          PSD_CACHE: kv,
        }),
      );

      expect(deleteCalls3.flat()).toEqual(["sanity-abc-123"]);
    });

    it("keeps a dropped id pending after a failed delete and retries it on the next sweep", async () => {
      const kv = makeKvNamespaceMock();

      // Sweep 1 (bootstrap): indexed.
      const { mock: mock1 } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep({ fetchResponsibility: noopFetch([mockDoc]) }, mock1, {
          SEARCH_INDEX_PRUNE_DRY_RUN: "false",
          PSD_CACHE: kv,
        }),
      );

      // Sweep 2: mockDoc drops out, dry-run off, but Vectorize's delete is
      // down — every deleteByIds call fails, even after retries.
      const messages: string[] = [];
      const TestLogger = Logger.make(({ message }) => {
        messages.push(String(message));
      });
      const { mock: failingVectorize } = makeVectorizeCapture({
        deleteByIds: () => Effect.fail(new VectorizeError("Vectorize outage")),
      });
      await Effect.runPromise(
        sweep({}, failingVectorize, {
          SEARCH_INDEX_PRUNE_DRY_RUN: "false",
          PSD_CACHE: kv,
        }).pipe(
          Effect.provide(Logger.replace(Logger.defaultLogger, TestLogger)),
        ),
      );

      // The log reports what was actually confirmed deleted (zero), not the
      // size of the attempted delete set.
      expect(messages.some((m) => m.includes("Pruned 0 orphaned"))).toBe(true);

      // Sweep 3: Vectorize recovers. mockDoc must still be in the manifest
      // for this sweep to find and delete — the failed attempt in sweep 2
      // must not have dropped it from tracking.
      const { deleteCalls: deleteCalls3, mock: mock3 } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep({}, mock3, {
          SEARCH_INDEX_PRUNE_DRY_RUN: "false",
          PSD_CACHE: kv,
        }),
      );

      expect(deleteCalls3.flat()).toEqual(["sanity-abc-123"]);
    });

    it("prunes a document whose entire visible life fit between two sweeps, tracked only via the webhook's addToManifest", async () => {
      const kv = makeKvNamespaceMock();

      // No sweep has ever observed "transient-doc" as current — simulate the
      // webhook's upsert path (webhooks/index-handler.ts) registering it the
      // moment it was published, the same way it registers every successful
      // upsert.
      await Effect.runPromise(addToManifest(kv, "production", "transient-doc"));

      // A sweep runs after "transient-doc" has both published AND expired
      // (its whole visible life fit between two sweeps) — no query returns
      // it.
      const { deleteCalls, mock } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep({}, mock, { SEARCH_INDEX_PRUNE_DRY_RUN: "false", PSD_CACHE: kv }),
      );

      expect(deleteCalls.flat()).toEqual(["transient-doc"]);
    });

    it("absorbs a marker written between sweeps into the manifest, and deletes its key so it isn't absorbed twice (#2856)", async () => {
      const kv = makeKvNamespaceMock();

      // Simulate the webhook registering an id via a pending marker
      // (addToManifest) — no sweep has bootstrapped a manifest yet.
      await Effect.runPromise(addToManifest(kv, "production", "webhook-added"));

      // The sweep runs and the id still matches its query (unlike the
      // "entire visible life fit between two sweeps" case above) — it
      // should land in the manifest as a normal tracked id, not get pruned.
      const { deleteCalls, mock } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep(
          {
            fetchResponsibility: noopFetch([
              { ...mockDoc, _id: "webhook-added" },
            ]),
          },
          mock,
          { SEARCH_INDEX_PRUNE_DRY_RUN: "false", PSD_CACHE: kv },
        ),
      );
      expect(deleteCalls).toHaveLength(0);

      const manifest = await Effect.runPromise(readManifest(kv, "production"));
      expect(manifest).toContain("webhook-added");

      // The marker key itself is gone — absorbed, not left to be absorbed
      // (and no-op re-unioned) forever.
      const pendingAfter = await Effect.runPromise(
        listPendingIds(kv, "production"),
      );
      expect(pendingAfter.ids).toHaveLength(0);
    });

    it("deletes an inactive responsibility that predates the first manifest, via the excluded-ids query", async () => {
      // No bootstrap sweep at all — the manifest has never tracked this id,
      // so a diff against it could never find it. Only the stateless
      // excluded-ids query (EXCLUDED_RESPONSIBILITY_QUERY) can, since it
      // asks Sanity directly rather than a history nothing wrote yet.
      const { deleteCalls, mock } = makeVectorizeCapture();

      await Effect.runPromise(
        sweep(
          { fetchExcludedResponsibilityIds: noopFetch(["inactive-resp"]) },
          mock,
          {
            SEARCH_INDEX_PRUNE_DRY_RUN: "false",
            PSD_CACHE: makeKvNamespaceMock(),
          },
        ),
      );

      expect(deleteCalls.flat()).toEqual(["inactive-resp"]);
    });

    it("deletes an article the published-window query now excludes, via the excluded-ids query", async () => {
      const { deleteCalls, mock } = makeVectorizeCapture();

      await Effect.runPromise(
        sweep(
          { fetchExcludedArticleIds: noopFetch(["expired-article"]) },
          mock,
          {
            SEARCH_INDEX_PRUNE_DRY_RUN: "false",
            PSD_CACHE: makeKvNamespaceMock(),
          },
        ),
      );

      expect(deleteCalls.flat()).toEqual(["expired-article"]);
    });

    it("refuses to prune when the delete set exceeds the safety cap, and the refusal does not self-heal", async () => {
      const kv = makeKvNamespaceMock();
      const manyDocs = Array.from({ length: 30 }, (_, i) => ({
        ...mockDoc,
        _id: `resp-${i}`,
      }));

      // Sweep 1 (bootstrap): 30 responsibilities indexed.
      const { mock: mock1 } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep({ fetchResponsibility: noopFetch(manyDocs) }, mock1, {
          SEARCH_INDEX_PRUNE_DRY_RUN: "false",
          PSD_CACHE: kv,
        }),
      );

      // Sweep 2: the fetch comes back with only 4 of the 30 — as if a
      // truncated GROQ response or a projection regression dropped the
      // rest, not a real mass deactivation. 26 dropped exceeds
      // max(25, 30*50%=15)=25, so nothing must be deleted.
      const fourRemain = manyDocs.slice(0, 4);
      const { deleteCalls: deleteCalls2, mock: mock2 } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep({ fetchResponsibility: noopFetch(fourRemain) }, mock2, {
          SEARCH_INDEX_PRUNE_DRY_RUN: "false",
          PSD_CACHE: kv,
        }),
      );
      expect(deleteCalls2).toHaveLength(0);

      // Sweep 3: nothing about the underlying data changed — the refusal
      // must NOT have quietly resolved itself. Same input, same refusal.
      const { deleteCalls: deleteCalls3, mock: mock3 } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep({ fetchResponsibility: noopFetch(fourRemain) }, mock3, {
          SEARCH_INDEX_PRUNE_DRY_RUN: "false",
          PSD_CACHE: kv,
        }),
      );
      expect(deleteCalls3).toHaveLength(0);

      // Sweep 4: the fetch recovers to all 30 — the 26 "missing" ids must
      // still be tracked (the refused sweeps must not have dropped them).
      const { deleteCalls: deleteCalls4, mock: mock4 } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep({ fetchResponsibility: noopFetch(manyDocs) }, mock4, {
          SEARCH_INDEX_PRUNE_DRY_RUN: "false",
          PSD_CACHE: kv,
        }),
      );
      expect(deleteCalls4).toHaveLength(0);
    });

    it("lets an oversized excluded-ids set through the safety cap while still refusing an oversized manifest diff — scoped independently", async () => {
      const kv = makeKvNamespaceMock();
      const stableDocs = [mockDoc, { ...mockDoc, _id: "stable-2" }];

      // Bootstrap: 2 responsibilities tracked, and every later sweep below
      // keeps fetching the exact same 2 — droppedFromManifest is always 0,
      // so the manifest-diff cap has nothing to ever refuse here.
      const { mock: mock1 } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep({ fetchResponsibility: noopFetch(stableDocs) }, mock1, {
          SEARCH_INDEX_PRUNE_DRY_RUN: "false",
          PSD_CACHE: kv,
        }),
      );

      // 30 excluded ids is, by itself, larger than the safety cap's floor
      // (25). If the cap wrongly applied to the excluded set (as it did
      // before scoping it to droppedFromManifest only), this sweep would
      // refuse to prune any of them — they're authoritative, not an
      // inference from a diff a truncated fetch could inflate, so they must
      // pass through regardless of size.
      const manyExcluded = Array.from(
        { length: 30 },
        (_, i) => `excluded-${i}`,
      );
      const { deleteCalls, mock } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep(
          {
            fetchResponsibility: noopFetch(stableDocs),
            fetchExcludedResponsibilityIds: noopFetch(manyExcluded),
          },
          mock,
          { SEARCH_INDEX_PRUNE_DRY_RUN: "false", PSD_CACHE: kv },
        ),
      );

      expect(new Set(deleteCalls.flat())).toEqual(new Set(manyExcluded));
    });

    it("writes the union of every type's ids to the manifest on the very first sweep", async () => {
      const kv = makeKvNamespaceMock();
      const { deleteCalls, mock } = makeVectorizeCapture();

      await Effect.runPromise(
        sweep(
          {
            fetchResponsibility: noopFetch([mockDoc]),
            fetchArticles: noopFetch([mockArticle]),
            fetchPages: noopFetch([mockPage]),
          },
          mock,
          { SEARCH_INDEX_PRUNE_DRY_RUN: "false", PSD_CACHE: kv },
        ),
      );

      expect(deleteCalls).toHaveLength(0);
      const manifest = await Effect.runPromise(readManifest(kv, "production"));
      expect(new Set(manifest)).toEqual(
        new Set(["sanity-abc-123", "article-001", "page-001"]),
      );
    });

    it("writes no manifest and deletes nothing when the article phase fails — the partial-sweep trap", async () => {
      const kv = makeKvNamespaceMock();

      // Sweep 1 succeeds fully and writes a manifest containing the article.
      const { mock: mock1 } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep({ fetchArticles: noopFetch([mockArticle]) }, mock1, {
          SEARCH_INDEX_PRUNE_DRY_RUN: "false",
          PSD_CACHE: kv,
        }),
      );

      // Sweep 2: the article phase's Sanity fetch fails outright. Even
      // though the article is now absent from articleResult (the phase's
      // catchAll degrades it to []), that absence must not be read as "this
      // article stopped matching the query" — it's unknown, not gone.
      const { deleteCalls, mock: mock2 } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep(
          {
            fetchArticles: async () => {
              throw new Error("Sanity timeout");
            },
          },
          mock2,
          { SEARCH_INDEX_PRUNE_DRY_RUN: "false", PSD_CACHE: kv },
        ),
      );
      expect(deleteCalls).toHaveLength(0);

      // Sweep 3, fetches succeed again with nothing changed: if sweep 2 had
      // wrongly overwritten the manifest with the empty article list, this
      // sweep would now (wrongly) delete article-001.
      const { deleteCalls: deleteCalls3, mock: mock3 } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep({ fetchArticles: noopFetch([mockArticle]) }, mock3, {
          SEARCH_INDEX_PRUNE_DRY_RUN: "false",
          PSD_CACHE: kv,
        }),
      );
      expect(deleteCalls3).toHaveLength(0);
    });

    it("writes no manifest and deletes nothing when the page phase fails, even though an unrelated drop looks real", async () => {
      // The footgun this guards: reconciliationSafe is one flag shared by
      // every phase. A page-fetch failure must suppress pruning for
      // EVERY type, not just pages — including a genuine responsibility
      // drop that happened in the very same sweep.
      const kv = makeKvNamespaceMock();

      const { mock: mock1 } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep({ fetchResponsibility: noopFetch([mockDoc]) }, mock1, {
          SEARCH_INDEX_PRUNE_DRY_RUN: "false",
          PSD_CACHE: kv,
        }),
      );

      const { deleteCalls, mock: mock2 } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep(
          {
            fetchResponsibility: noopFetch([]), // a genuine drop
            fetchPages: async () => {
              throw new Error("Sanity timeout");
            },
          },
          mock2,
          { SEARCH_INDEX_PRUNE_DRY_RUN: "false", PSD_CACHE: kv },
        ),
      );

      expect(deleteCalls).toHaveLength(0);
    });

    it("writes no manifest and deletes nothing when the excluded-ids phase fails, even though an unrelated drop looks real", async () => {
      const kv = makeKvNamespaceMock();

      const { mock: mock1 } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep({ fetchResponsibility: noopFetch([mockDoc]) }, mock1, {
          SEARCH_INDEX_PRUNE_DRY_RUN: "false",
          PSD_CACHE: kv,
        }),
      );

      const { deleteCalls, mock: mock2 } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep(
          {
            fetchResponsibility: noopFetch([]), // a genuine drop
            fetchExcludedResponsibilityIds: async () => {
              throw new Error("Sanity timeout");
            },
          },
          mock2,
          { SEARCH_INDEX_PRUNE_DRY_RUN: "false", PSD_CACHE: kv },
        ),
      );

      expect(deleteCalls).toHaveLength(0);
    });

    it("logs the delete set without calling deleteByIds when the dry-run flag is on", async () => {
      const kv = makeKvNamespaceMock();
      const messages: string[] = [];
      const TestLogger = Logger.make(({ message }) => {
        messages.push(String(message));
      });

      const { mock: mock1 } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep({ fetchResponsibility: noopFetch([mockDoc]) }, mock1, {
          SEARCH_INDEX_PRUNE_DRY_RUN: "false",
          PSD_CACHE: kv,
        }),
      );

      // Sweep 2: dry-run left at its default ("true" when unset — fail safe).
      const { deleteCalls, mock: mock2 } = makeVectorizeCapture();
      await Effect.runPromise(
        sweep({}, mock2, { PSD_CACHE: kv }).pipe(
          Effect.provide(Logger.replace(Logger.defaultLogger, TestLogger)),
        ),
      );

      expect(deleteCalls).toHaveLength(0);
      expect(
        messages.some(
          (m) => m.includes("DRY RUN") && m.includes("sanity-abc-123"),
        ),
      ).toBe(true);
    });

    describe("manifest read failures (#2831) — unreadable is not the same as empty", () => {
      it("skips reconciliation and leaves the manifest untouched when the KV read throws", async () => {
        const kv = makeKvNamespaceMock();
        kv.store.set(MANIFEST_KEY, JSON.stringify(["existing-id"]));
        const originalGet = kv.get;
        kv.get = (() =>
          Promise.reject(new Error("KV unavailable"))) as KVNamespace["get"];

        const { deleteCalls, mock } = makeVectorizeCapture();
        await Effect.runPromise(
          sweep({}, mock, {
            SEARCH_INDEX_PRUNE_DRY_RUN: "false",
            PSD_CACHE: kv,
          }),
        );

        expect(deleteCalls).toHaveLength(0);
        kv.get = originalGet;
        expect(kv.store.get(MANIFEST_KEY)).toBe(
          JSON.stringify(["existing-id"]),
        );
      });

      it.each([
        ["not valid JSON", "not valid json{{{"],
        ["valid JSON but not an array", JSON.stringify({ not: "an array" })],
      ])(
        "skips reconciliation and leaves the manifest untouched when the stored value is %s",
        async (_label, corruptValue) => {
          const kv = makeKvNamespaceMock();
          kv.store.set(MANIFEST_KEY, corruptValue);

          const { deleteCalls, mock } = makeVectorizeCapture();
          await Effect.runPromise(
            sweep({}, mock, {
              SEARCH_INDEX_PRUNE_DRY_RUN: "false",
              PSD_CACHE: kv,
            }),
          );

          expect(deleteCalls).toHaveLength(0);
          expect(kv.store.get(MANIFEST_KEY)).toBe(corruptValue);
        },
      );
    });
  });
});
