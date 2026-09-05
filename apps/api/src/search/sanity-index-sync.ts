import { createClient } from "@sanity/client";
import { Array as Arr, Effect, Schedule } from "effect";
import { WorkerEnvTag } from "../env";
import { sanityClientConfig } from "../sanity/config";
import { datasetIndexMismatch } from "./dataset-index-guard";
import { EmbeddingService } from "./embedding";
import {
  ARTICLE_INDEX_PROJECTION,
  ARTICLE_PUBLISHED_FILTER,
  PAGE_INDEX_PROJECTION,
  RESPONSIBILITY_ACTIVE_FILTER,
  RESPONSIBILITY_INDEX_PROJECTION,
  buildArticleIndexText,
  buildArticleMetadata,
  buildPageIndexText,
  buildPageMetadata,
  buildResponsibilityIndexText,
  buildResponsibilityMetadata,
} from "./index-queries";
import { VectorizeService, type VectorRecord } from "./vectorize";

// ─── Types (only fields needed for indexing) ──────────────────────────────────

interface SanityResponsibilityDoc {
  _id: string;
  slug: string;
  title: string;
  question: string;
  keywords: string[];
  summary: string;
}

interface SanityArticleDoc {
  _id: string;
  slug: string;
  title: string;
  lead: string;
  tags: string[];
  prose: string;
  qaQuestions: string[];
  qaAnswers: string;
  tableHtml: string[];
  imageUrl: string | null;
}

interface SanityPageDoc {
  _id: string;
  slug: string;
  title: string;
  bodyText: string | null;
  fileAttachmentLabels: string[];
}

// ─── Sanity GROQ queries ─────────────────────────────────────────────────────

const RESPONSIBILITY_QUERY = `*[_type == "responsibility" && ${RESPONSIBILITY_ACTIVE_FILTER}] {
  ${RESPONSIBILITY_INDEX_PROJECTION}
}`;

// Exported for the test that pins the `publishedAt` field name — the
// reconciliation injects its fetcher, so nothing else exercises this string.
export const ARTICLE_QUERY = `*[_type == "article" && ${ARTICLE_PUBLISHED_FILTER}] {
  ${ARTICLE_INDEX_PROJECTION}
}`;

const PAGE_QUERY = `*[_type == "page"] {
  ${PAGE_INDEX_PROJECTION}
}`;

// ─── Batching ────────────────────────────────────────────────────────────────

// Vectorize caps a binding upsert at 1000 vectors/request. Its write-ahead log
// handles one batch at a time and does not queue concurrent writes, so chunks
// go out sequentially — parallel upserts contend for that slot and surface as
// 40041 Too Many Requests.
const MAX_VECTORS_PER_UPSERT = 1000;

// Belt-and-suspenders for a transient limit; batching is what removes the burst.
const UPSERT_RETRY = Schedule.exponential("100 millis").pipe(
  Schedule.jittered,
  Schedule.intersect(Schedule.recurs(3)),
);

// ─── Options ─────────────────────────────────────────────────────────────────

interface SyncOptions {
  fetchResponsibility?: () => Promise<SanityResponsibilityDoc[]>;
  fetchArticles?: () => Promise<SanityArticleDoc[]>;
  fetchPages?: () => Promise<SanityPageDoc[]>;
}

// ─── Sync effect ─────────────────────────────────────────────────────────────

export const runSanityIndexSync = (options?: SyncOptions) =>
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;

    // Refuse the whole run when this worker's dataset doesn't match its
    // configured index (#2833). This job is unreachable on staging today
    // (`env.staging.triggers.crons` is `[]`) — but that is the same "no
    // cron" reasoning this issue was filed to retire for the webhook, and
    // it stops being true the moment anything triggers this run manually
    // (see the staging backfill instructions in apps/api/CLAUDE.md).
    const mismatch = datasetIndexMismatch(env);
    if (mismatch) {
      return yield* Effect.fail(
        new Error(`[search-sync] refusing to sync: ${mismatch}`),
      );
    }

    const embedding = yield* EmbeddingService;
    const vectorize = yield* VectorizeService;

    let _sanityClient: ReturnType<typeof createClient> | undefined;
    const sanityClient = () =>
      (_sanityClient ??= createClient({
        ...sanityClientConfig(env),
        useCdn: false,
        perspective: "published",
      }));

    // A failed embedding drops just its own document from the batch.
    const embedDoc = (
      id: string,
      text: string,
      metadata: Record<string, string>,
    ) =>
      embedding.embed(text).pipe(
        Effect.map((values): VectorRecord | null => ({ id, values, metadata })),
        Effect.catchAll((e) =>
          Effect.log(`[search-sync] skipped ${id}: ${String(e)}`).pipe(
            Effect.as(null),
          ),
        ),
      );

    /**
     * Upserts the embedded documents in ≤1000-sized chunks, skipping the ones
     * that failed to embed. Returns how many vectors landed.
     */
    const upsertBatched = (
      embedded: (VectorRecord | null)[],
      label: string,
    ) => {
      const vectors = embedded.filter((v) => v !== null);
      return Effect.forEach(
        Arr.chunksOf(vectors, MAX_VECTORS_PER_UPSERT),
        (chunk) =>
          vectorize.upsert(chunk).pipe(
            Effect.retry(UPSERT_RETRY),
            Effect.as(chunk.length),
            Effect.catchAll((e) =>
              Effect.logError(
                `[search-sync] Upsert failed after retries — dropped ${chunk.length} of ${vectors.length} ${label}: ${String(e)}`,
              ).pipe(Effect.as(0)),
            ),
          ),
        { concurrency: 1 },
      ).pipe(Effect.map((landed) => landed.reduce((total, n) => total + n, 0)));
    };

    // ── Responsibility paths ──────────────────────────────────────────────

    const fetchResponsibility =
      options?.fetchResponsibility ??
      (() =>
        sanityClient().fetch<SanityResponsibilityDoc[]>(RESPONSIBILITY_QUERY));

    const docs = yield* Effect.tryPromise({
      try: fetchResponsibility,
      catch: (e) => new Error(`Sanity fetch failed: ${String(e)}`),
    });

    yield* Effect.log(
      `[search-sync] Indexing ${docs.length} responsibility paths`,
    );

    const responsibilityVectors = yield* Effect.forEach(
      docs,
      (doc) =>
        embedDoc(
          doc._id,
          buildResponsibilityIndexText(doc),
          buildResponsibilityMetadata(doc),
        ),
      { concurrency: 5 },
    );

    const successCount = yield* upsertBatched(
      responsibilityVectors,
      "responsibility paths",
    );

    yield* Effect.log(
      `[search-sync] Indexed ${successCount}/${docs.length} responsibility paths`,
    );

    // ── Articles ──────────────────────────────────────────────────────────

    const fetchArticles =
      options?.fetchArticles ??
      (() => sanityClient().fetch<SanityArticleDoc[]>(ARTICLE_QUERY));

    const articleResult = yield* Effect.tryPromise({
      try: fetchArticles,
      catch: (e) => new Error(`Sanity article fetch failed: ${String(e)}`),
    }).pipe(
      Effect.catchAll((e) => {
        return Effect.log(`[search-sync] Skipping articles: ${String(e)}`).pipe(
          Effect.map(() => [] as SanityArticleDoc[]),
        );
      }),
    );

    yield* Effect.log(
      `[search-sync] Indexing ${articleResult.length} articles`,
    );

    const articleVectors = yield* Effect.forEach(
      articleResult,
      (doc) =>
        embedDoc(
          doc._id,
          buildArticleIndexText(doc),
          buildArticleMetadata(doc),
        ),
      { concurrency: 3 },
    );

    const articleSuccessCount = yield* upsertBatched(
      articleVectors,
      "articles",
    );

    yield* Effect.log(
      `[search-sync] Indexed ${articleSuccessCount}/${articleResult.length} articles`,
    );

    // ── Pages ─────────────────────────────────────────────────────────────

    const fetchPages =
      options?.fetchPages ??
      (() => sanityClient().fetch<SanityPageDoc[]>(PAGE_QUERY));

    const pageResult = yield* Effect.tryPromise({
      try: fetchPages,
      catch: (e) => new Error(`Sanity page fetch failed: ${String(e)}`),
    }).pipe(
      Effect.catchAll((e) => {
        return Effect.log(`[search-sync] Skipping pages: ${String(e)}`).pipe(
          Effect.map(() => [] as SanityPageDoc[]),
        );
      }),
    );

    yield* Effect.log(`[search-sync] Indexing ${pageResult.length} pages`);

    const pageVectors = yield* Effect.forEach(
      pageResult,
      (doc) =>
        embedDoc(doc._id, buildPageIndexText(doc), buildPageMetadata(doc)),
      { concurrency: 3 },
    );

    const pageSuccessCount = yield* upsertBatched(pageVectors, "pages");

    yield* Effect.log(
      `[search-sync] Indexed ${pageSuccessCount}/${pageResult.length} pages`,
    );
  });
