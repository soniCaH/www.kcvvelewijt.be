import { createClient } from "@sanity/client";
import { Effect } from "effect";
import { WorkerEnvTag } from "../env";
import { EmbeddingService } from "./embedding";
import {
  buildArticleIndexText,
  buildPageIndexText,
  buildResponsibilityIndexText,
} from "./index-text";
import { VectorizeService } from "./vectorize";

// ─── Types (only fields needed for indexing) ──────────────────────────────────

interface SanityResponsibilityDoc {
  _id: string;
  slug: string;
  title: string;
  question: string;
  keywords: string[];
  summary: string;
  category: string;
}

interface SanityArticleDoc {
  _id: string;
  slug: string;
  title: string;
  tags: string[];
  bodyText: string | null;
}

interface SanityPageDoc {
  _id: string;
  slug: string;
  title: string;
  bodyText: string | null;
}

// ─── Sanity GROQ queries ─────────────────────────────────────────────────────

const RESPONSIBILITY_QUERY = `*[_type == "responsibilityPath" && active == true] {
  _id,
  "slug": coalesce(slug.current, ""),
  title,
  question,
  "keywords": coalesce(keywords, []),
  "summary": coalesce(summary, ""),
  category
}`;

const ARTICLE_QUERY = `*[_type == "article" && publishAt <= now() && (!defined(unpublishAt) || unpublishAt > now())] {
  _id,
  "slug": coalesce(slug.current, ""),
  title,
  "tags": coalesce(tags, []),
  "bodyText": pt::text(body)
}`;

const PAGE_QUERY = `*[_type == "page"] {
  _id,
  "slug": coalesce(slug.current, ""),
  title,
  "bodyText": pt::text(body)
}`;

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
    const embedding = yield* EmbeddingService;
    const vectorize = yield* VectorizeService;

    let _sanityClient: ReturnType<typeof createClient> | undefined;
    const sanityClient = () =>
      (_sanityClient ??= createClient({
        projectId: env.SANITY_PROJECT_ID,
        dataset: env.SANITY_DATASET,
        apiVersion: "2024-01-01",
        token: env.SANITY_API_TOKEN,
        useCdn: false,
        perspective: "published",
      }));

    const indexDoc = (
      id: string,
      text: string,
      metadata: Record<string, string>,
    ) =>
      embedding.embed(text).pipe(
        Effect.flatMap((vector) =>
          vectorize.upsert([{ id, values: vector, metadata }]),
        ),
        Effect.as(true),
        Effect.catchAll((e) =>
          Effect.log(`[search-sync] skipped ${id}: ${String(e)}`).pipe(
            Effect.as(false),
          ),
        ),
      );

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

    let successCount = 0;

    yield* Effect.forEach(
      docs,
      (doc) =>
        indexDoc(doc._id, buildResponsibilityIndexText(doc), {
          slug: doc.slug,
          type: "responsibilityPath",
          title: doc.title,
          excerpt: doc.summary.slice(0, 200),
        }).pipe(
          Effect.tap((ok) =>
            Effect.sync(() => {
              if (ok) successCount++;
            }),
          ),
        ),
      { concurrency: 5 },
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

    let articleSuccessCount = 0;

    yield* Effect.forEach(
      articleResult,
      (doc) =>
        indexDoc(doc._id, buildArticleIndexText(doc), {
          slug: doc.slug,
          type: "article",
          title: doc.title,
          excerpt: (doc.bodyText ?? "").slice(0, 200),
          tags: (doc.tags ?? []).join(","),
        }).pipe(
          Effect.tap((ok) =>
            Effect.sync(() => {
              if (ok) articleSuccessCount++;
            }),
          ),
        ),
      { concurrency: 3 },
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

    let pageSuccessCount = 0;

    yield* Effect.forEach(
      pageResult,
      (doc) =>
        indexDoc(doc._id, buildPageIndexText(doc), {
          slug: doc.slug,
          type: "page",
          title: doc.title,
          excerpt: (doc.bodyText ?? "").slice(0, 200),
        }).pipe(
          Effect.tap((ok) =>
            Effect.sync(() => {
              if (ok) pageSuccessCount++;
            }),
          ),
        ),
      { concurrency: 3 },
    );

    yield* Effect.log(
      `[search-sync] Indexed ${pageSuccessCount}/${pageResult.length} pages`,
    );
  });
