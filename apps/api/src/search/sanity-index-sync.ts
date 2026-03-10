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

// ─── Portable Text → plain text (issue #751) ──────────────────────────────────

function ptToText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return "";
  return blocks
    .flatMap((block: unknown) => {
      if (typeof block !== "object" || block === null) return [];
      const b = block as Record<string, unknown>;
      if (b["_type"] !== "block" || !Array.isArray(b["children"])) return [];
      return (b["children"] as Array<{ text?: string }>)
        .map((child) => child.text ?? "")
        .filter(Boolean);
    })
    .join(" ")
    .trim();
}

// ─── Text to embed per document ───────────────────────────────────────────────

function buildIndexText(doc: SanityResponsibilityDoc): string {
  return [doc.title, doc.question, doc.keywords.join(" "), doc.summary]
    .filter(Boolean)
    .join(". ");
}

// ─── Sanity GROQ query ────────────────────────────────────────────────────────

const QUERY = `*[_type == "responsibilityPath" && active == true] {
  _id,
  "slug": slug.current,
  title,
  question,
  keywords,
  summary,
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

    console.log(`[search-sync] Indexing ${docs.length} responsibility paths`);

    for (const doc of docs) {
      const text = buildIndexText(doc);
      const vector = yield* embedding.embed(text).pipe(Effect.orDie);
      yield* vectorize
        .upsert([
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
        ])
        .pipe(Effect.orDie);
    }

    console.log(`[search-sync] Indexed ${docs.length} documents`);
  });

// re-export for unused lint suppression
export { ptToText };
