import { createClient } from "@sanity/client";
import { Effect } from "effect";
import { WorkerEnvTag } from "../env";
import { EmbeddingService } from "./embedding";
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

type FetchFn = () => Promise<SanityResponsibilityDoc[]>;

// ─── Text to embed per document ───────────────────────────────────────────────

function buildIndexText(doc: SanityResponsibilityDoc): string {
  return [doc.title, doc.question, doc.keywords.join(" "), doc.summary]
    .filter(Boolean)
    .join(". ");
}

// ─── Sanity GROQ query ────────────────────────────────────────────────────────

const QUERY = `*[_type == "responsibilityPath" && active == true] {
  _id,
  "slug": coalesce(slug.current, ""),
  title,
  question,
  "keywords": coalesce(keywords, []),
  "summary": coalesce(summary, ""),
  category
}`;

// ─── Sync effect (accepts injectable fetch for testing) ───────────────────────

export const runSanityIndexSync = (fetchFn?: FetchFn) =>
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;
    const embedding = yield* EmbeddingService;
    const vectorize = yield* VectorizeService;

    const fetch_: FetchFn =
      fetchFn ??
      (() =>
        createClient({
          projectId: env.SANITY_PROJECT_ID,
          dataset: env.SANITY_DATASET,
          apiVersion: "2024-01-01",
          token: env.SANITY_API_TOKEN,
          useCdn: false,
        }).fetch<SanityResponsibilityDoc[]>(QUERY));

    const docs = yield* Effect.tryPromise({
      try: fetch_,
      catch: (e) => new Error(`Sanity fetch failed: ${String(e)}`),
    });

    yield* Effect.log(
      `[search-sync] Indexing ${docs.length} responsibility paths`,
    );

    let successCount = 0;

    yield* Effect.forEach(
      docs,
      (doc) => {
        const text = buildIndexText(doc);
        return embedding.embed(text).pipe(
          Effect.flatMap((vector) =>
            vectorize.upsert([
              {
                id: doc._id,
                values: vector,
                metadata: {
                  slug: doc.slug,
                  type: "responsibilityPath",
                  title: doc.title,
                  excerpt: doc.summary.slice(0, 200),
                },
              },
            ]),
          ),
          Effect.tap(() =>
            Effect.sync(() => {
              successCount++;
            }),
          ),
          Effect.catchAll((e) =>
            Effect.log(
              `[search-sync] skipped doc ${doc._id} (${doc.slug}): ${String(e)}`,
            ),
          ),
        );
      },
      { concurrency: 5 },
    );

    yield* Effect.log(
      `[search-sync] Indexed ${successCount}/${docs.length} documents`,
    );
  });
