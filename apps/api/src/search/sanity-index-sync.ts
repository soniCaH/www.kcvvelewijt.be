import { createClient } from "@sanity/client";
import { Array as Arr, Effect, Either, Schedule } from "effect";
import { WorkerEnvTag } from "../env";
import { sanityClientConfig } from "../sanity/config";
import { datasetIndexMismatch } from "./dataset-index-guard";
import { EmbeddingService } from "./embedding";
import {
  deletePendingKeys,
  listPendingIds,
  readManifest,
  writeManifest,
} from "./index-manifest";
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

// The documents each type's query excludes — negating the SAME exported
// filter constants the include-queries above use, so the two can never
// drift apart. Authoritative and stateless: unlike the manifest diff, these
// ids need no history to find, so they also catch a document excluded
// before this mechanism's first manifest write ever ran (#2831).
const EXCLUDED_RESPONSIBILITY_QUERY = `*[_type == "responsibility" && !(${RESPONSIBILITY_ACTIVE_FILTER})]._id`;
const EXCLUDED_ARTICLE_QUERY = `*[_type == "article" && !(${ARTICLE_PUBLISHED_FILTER})]._id`;

// ─── Batching ────────────────────────────────────────────────────────────────

// Vectorize caps a binding upsert (and, by the same platform limit, a
// delete) at 1000 vectors/request. Its write-ahead log handles one batch at
// a time and does not queue concurrent writes, so chunks go out
// sequentially — parallel calls contend for that slot and surface as 40041
// Too Many Requests.
const MAX_VECTORS_PER_UPSERT = 1000;

// Belt-and-suspenders for a transient limit; batching is what removes the burst.
const UPSERT_RETRY = Schedule.exponential("100 millis").pipe(
  Schedule.jittered,
  Schedule.intersect(Schedule.recurs(3)),
);

// A fetch that succeeds but returns an incomplete result (a truncated GROQ
// response as the corpus grows, a projection regression that drops `_id`)
// looks identical to "these documents stopped matching" — reconciliationSafe
// only catches a fetch that throws, not one that lies. Refusing to prune
// above this threshold in one sweep is a cheap ceiling on the blast radius.
// Applies only to the manifest-diff portion of a sweep's deletes (below) —
// the excluded-ids queries are authoritative, not an inference from a diff
// a truncated fetch could inflate, so they're never subject to this cap.
//
// The threshold is `max(FLOOR, previousManifest.length * FRACTION)`, not the
// fraction alone: against a small manifest, a single legitimate drop (e.g.
// one of ten tracked ids going inactive) is 10%–100% of it, so a fraction
// alone would refuse ordinary churn. FLOOR=25 stays well under the current
// ~166-id corpus's real drift (single digits a night, ≤37 for the one-time
// backlog) while giving a small manifest room to shrink normally.
//
// A genuine trip past this — a true bulk deactivation, or a truncated fetch
// — is NOT self-healing: the manifest-diff is recomputed identically every
// sweep until the underlying data changes, so it refuses again every night
// rather than one-time skip. Clearing it is a human decision, not a retry —
// see apps/api/CLAUDE.md, "Releasing a stuck prune safety cap", for the
// release lever once the refusal has been investigated.
const PRUNE_SAFETY_CAP_FRACTION = 0.5;
const PRUNE_SAFETY_FLOOR = 25;

// ─── Reconciliation ────────────────────────────────────────────────────────
//
// Vectorize exposes exactly upsert / query / getByIds / deleteByIds — no
// list, no scan, no cursor. A delete must always be addressed by an id this
// worker already knows, so "what should be pruned" has to come from three
// sources other than the index itself:
//
// 1. A KV manifest (index-manifest.ts) of ids the index is believed to
//    hold — a single array, written only by this sweep.
//    `effectivePreviousManifest − currentIds` catches anything it named
//    that no longer matches, including a document deleted from Sanity
//    outright (nothing else can ever name that id).
// 2. Pending markers — the webhook's upsert path (webhooks/index-handler.ts)
//    drops a put-only marker per id instead of read-modify-writing the
//    manifest array directly (#2856: two concurrent webhooks racing one
//    shared array is a lost-update bug a retry cannot fix, since a retry
//    re-reads the same stale value). This sweep lists and absorbs every
//    pending marker into `effectivePreviousManifest` BEFORE diffing — not
//    just before writing — so a document whose entire visible life fit
//    between two sweeps (published and unpublished the same day, with no
//    sweep ever seeing it as current) is folded in and pruned by this same
//    sweep's diff, then its marker key is deleted so it isn't absorbed
//    again.
// 3. The excluded-ids queries above — stateless and authoritative, so they
//    also catch a document excluded before the manifest ever tracked it (a
//    responsibility deactivated pre-dating this mechanism's first write).
//
// Only ids Vectorize actually confirms deleting leave the manifest — a dry
// run, a failed delete chunk, or a cap refusal all confirm nothing, so
// those ids stay pending for the next sweep to retry.
//
// What NEITHER source covers: a vector already in the index whose Sanity
// document is ALSO already gone, from before this mechanism's first
// manifest write. Nothing can name that id after the fact — Vectorize has
// no list-ids call, and Sanity no longer has the document either. Cleaning
// up that pre-existing population is a separate, one-off, manually-run
// exercise (see the PR description for the measured count).
//
// Cost per sweep: 2 extra GROQ reads (excluded ids) + 1 KV read + 1 KV list
// (pending markers, normally near-empty) + 1 KV write (the manifest array,
// currently ~166 ids / ~6.5 KB, far under KV's 25 MB value cap) + one KV
// delete per absorbed marker, plus ceil(prunedCount / MAX_VECTORS_PER_UPSERT)
// additional deleteByIds calls. Negligible against the ~175-subrequest
// sweep this corpus already makes, dominated by embed calls. Per webhook
// call: one KV put replaces what used to be one KV get + one KV put — less
// work, not more, and no shared key to contend on with another webhook.

// ─── Options ─────────────────────────────────────────────────────────────────

interface SyncOptions {
  fetchResponsibility?: () => Promise<SanityResponsibilityDoc[]>;
  fetchArticles?: () => Promise<SanityArticleDoc[]>;
  fetchPages?: () => Promise<SanityPageDoc[]>;
  fetchExcludedResponsibilityIds?: () => Promise<string[]>;
  fetchExcludedArticleIds?: () => Promise<string[]>;
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

    // Fails safe: anything other than the literal "false" is dry-run, so an
    // absent var (local dev, a test that doesn't set it) or a typo never
    // silently starts deleting production vectors (#2831).
    const dryRun = env.SEARCH_INDEX_PRUNE_DRY_RUN !== "false";

    // Whether every degradable fetch this sweep ran actually succeeded.
    // fetchPhase below is the only way any phase gets its items, and it
    // always records the outcome here as a side effect of being called —
    // there is no separate "remember to flag it" step for a future phase to
    // skip (#2831).
    let reconciliationSafe = true;

    /**
     * Runs one Sanity fetch, degrading a failure to an empty result so
     * indexing continues for the phases that did succeed — and recording
     * that degradation in `reconciliationSafe` unconditionally, because a
     * fabricated-empty result is indistinguishable from "these documents
     * stopped matching" once handed to the reconciliation step below.
     */
    const fetchPhase = <T>(
      label: string,
      fetch: () => Promise<T[]>,
    ): Effect.Effect<T[]> =>
      Effect.tryPromise({
        try: fetch,
        catch: (e) => new Error(`Sanity ${label} fetch failed: ${String(e)}`),
      }).pipe(
        Effect.catchAll((e) => {
          reconciliationSafe = false;
          return Effect.log(
            `[search-sync] Skipping ${label}: ${String(e)}`,
          ).pipe(Effect.as([] as T[]));
        }),
      );

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

    /**
     * Deletes ids in ≤1000-sized chunks, sequentially — same shape as
     * upsertBatched, same reason. Returns the ids actually confirmed
     * deleted: a chunk that keeps failing after retries is logged and
     * skipped rather than aborting the rest, and its ids are NOT included in
     * the result — the caller must not drop them from the manifest, or a
     * Vectorize outage during the prune window would forget them forever.
     */
    const deleteBatched = (ids: readonly string[]): Effect.Effect<string[]> =>
      Effect.forEach(
        Arr.chunksOf(ids, MAX_VECTORS_PER_UPSERT),
        (chunk) =>
          vectorize.deleteByIds(chunk).pipe(
            Effect.retry(UPSERT_RETRY),
            Effect.as(chunk),
            Effect.catchAll((e) =>
              Effect.logError(
                `[search-sync] Prune failed after retries — could not delete ${chunk.length} of ${ids.length} orphaned vectors: ${String(e)}`,
              ).pipe(Effect.as([] as string[])),
            ),
          ),
        { concurrency: 1 },
      ).pipe(Effect.map((confirmed) => confirmed.flat()));

    // ── Responsibility paths ──────────────────────────────────────────────
    // No catchAll: a failed fetch here fails the whole run (Effect.gen
    // aborts before reaching reconciliation), a stronger guarantee than
    // reconciliationSafe gives the other phases.

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

    const articleResult = yield* fetchPhase(
      "articles",
      options?.fetchArticles ??
        (() => sanityClient().fetch<SanityArticleDoc[]>(ARTICLE_QUERY)),
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

    const pageResult = yield* fetchPhase(
      "pages",
      options?.fetchPages ??
        (() => sanityClient().fetch<SanityPageDoc[]>(PAGE_QUERY)),
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

    // ── Excluded ids ──────────────────────────────────────────────────────
    // Stateless and authoritative — see the "Reconciliation" block comment
    // above. Routed through fetchPhase too: a truncated/failed read here is
    // exactly as untrustworthy for reconciliation as a truncated article or
    // page fetch would be.

    const excludedResponsibilityIds = yield* fetchPhase(
      "excluded responsibilities",
      options?.fetchExcludedResponsibilityIds ??
        (() => sanityClient().fetch<string[]>(EXCLUDED_RESPONSIBILITY_QUERY)),
    );

    const excludedArticleIds = yield* fetchPhase(
      "excluded articles",
      options?.fetchExcludedArticleIds ??
        (() => sanityClient().fetch<string[]>(EXCLUDED_ARTICLE_QUERY)),
    );

    // ── Reconciliation ───────────────────────────────────────────────────

    if (!reconciliationSafe) {
      yield* Effect.log(
        "[search-sync] Skipping reconciliation — a fetch phase failed this sweep, so its result set can't be trusted to diff against",
      );
    } else {
      const currentIds = [
        ...docs.map((d) => d._id),
        ...articleResult.map((d) => d._id),
        ...pageResult.map((d) => d._id),
      ];

      const manifestRead = yield* Effect.either(
        readManifest(env.PSD_CACHE, env.SANITY_DATASET),
      );

      if (Either.isLeft(manifestRead)) {
        yield* Effect.logWarning(
          `[search-sync] Skipping reconciliation — manifest read failed, leaving it untouched: ${String(manifestRead.left)}`,
        );
      } else {
        const previousManifest = manifestRead.right;

        // Absorb pending markers (webhook additions, #2856) BEFORE diffing,
        // not just before writing — see the "Reconciliation" block comment
        // above. Folding them in here is what lets a document whose entire
        // life fit between two sweeps get pruned by THIS sweep's diff
        // rather than waiting one more cycle. A failed list just means
        // "nothing absorbed this sweep" — the markers themselves are
        // untouched by a failed list (nothing was deleted), so they're
        // retried next sweep; not worth failing the whole reconciliation
        // over, unlike a failed manifest read.
        const pendingRead = yield* Effect.either(
          listPendingIds(env.PSD_CACHE, env.SANITY_DATASET),
        );
        if (Either.isLeft(pendingRead)) {
          yield* Effect.logWarning(
            `[search-sync] Could not list pending markers this sweep, will retry next time: ${String(pendingRead.left)}`,
          );
        }
        const { ids: pendingIds, keys: pendingKeys } = Either.getOrElse(
          pendingRead,
          () => ({ ids: [] as string[], keys: [] as string[] }),
        );
        const effectivePreviousManifest = [
          ...new Set([...previousManifest, ...pendingIds]),
        ];

        const currentIdSet = new Set(currentIds);
        const droppedFromManifest = effectivePreviousManifest.filter(
          (id) => !currentIdSet.has(id),
        );

        // The safety cap applies only to droppedFromManifest, not to the
        // excluded-ids sets below. droppedFromManifest is an INFERENCE from
        // a diff — a truncated or regressed fetch can inflate it, which is
        // exactly what the cap guards against. The excluded-ids queries are
        // AUTHORITATIVE — Sanity directly confirming "this document exists
        // and does not match" — so a truncated excluded-ids fetch can only
        // yield FEWER deletes, never more, and never needs the cap.
        //
        // Excluded ids also recur in every sweep's toDelete by design:
        // nothing removes an id from Sanity's exclusion set once excluded,
        // and there is no local record of "already asked Vectorize to
        // delete this one" to consult. That's deliberately not a problem —
        // deleteByIds on an id Vectorize no longer holds is a documented
        // no-op, and these ids ride inside a deleteBatched call already
        // batched at ≤1000 ids, so re-including them costs zero extra
        // Vectorize requests. A tombstone/pending store to suppress the
        // repeat would add persistent state to save nothing.
        const manifestDropExceedsCap =
          droppedFromManifest.length >
          Math.max(
            PRUNE_SAFETY_FLOOR,
            effectivePreviousManifest.length * PRUNE_SAFETY_CAP_FRACTION,
          );
        const toDelete = [
          ...new Set([
            ...(manifestDropExceedsCap ? [] : droppedFromManifest),
            ...excludedResponsibilityIds,
            ...excludedArticleIds,
          ]),
        ];

        let confirmedDeleted: string[] = [];

        if (manifestDropExceedsCap) {
          yield* Effect.logWarning(
            `[search-sync] Refusing to prune ${droppedFromManifest.length} of ${effectivePreviousManifest.length} manifest entries — exceeds the safety cap (max(${PRUNE_SAFETY_FLOOR}, ${PRUNE_SAFETY_CAP_FRACTION * 100}%)). Skipping the manifest-diff portion of this sweep's prune (excluded-ids deletes, if any, still proceed below — they're authoritative, not subject to this cap). This does not self-heal: investigate, then see apps/api/CLAUDE.md ("Releasing a stuck prune safety cap") for the release lever once the cause is understood.`,
          );
        }

        if (toDelete.length === 0) {
          yield* Effect.log("[search-sync] Reconciliation: nothing to prune");
        } else if (dryRun) {
          yield* Effect.log(
            `[search-sync] DRY RUN — would prune ${toDelete.length} orphaned vector(s): ${toDelete.join(", ")}`,
          );
        } else {
          confirmedDeleted = yield* deleteBatched(toDelete);
          yield* Effect.log(
            `[search-sync] Pruned ${confirmedDeleted.length} orphaned vector(s)`,
          );
        }

        // (effectivePreviousManifest ∪ currentIds) − confirmedDeleted — see
        // the block comment above for why union, and why only confirmed.
        const nextManifest = new Set([
          ...effectivePreviousManifest,
          ...currentIds,
        ]);
        for (const id of confirmedDeleted) nextManifest.delete(id);
        yield* writeManifest(env.PSD_CACHE, env.SANITY_DATASET, [
          ...nextManifest,
        ]);

        // Only delete the markers once the manifest write they were folded
        // into has actually landed — if writeManifest fails, this line
        // never runs (the failure propagates and fails the sweep), so the
        // markers survive to be absorbed again next time instead of being
        // silently lost.
        if (pendingKeys.length > 0) {
          yield* deletePendingKeys(env.PSD_CACHE, pendingKeys);
        }
      }
    }

    // Report a real outcome (#2870 review). `embedDoc` and `upsertBatched`
    // above degrade every embedding/upsert failure to "log and skip" so one
    // bad document never aborts the rest of the sweep — but that means
    // `Effect.runPromise` on this whole function used to resolve
    // successfully even when Workers AI rate-limited every embed, or
    // Vectorize rejected every upsert: zero vectors landed, search silently
    // stopped updating, and the caller had no way to tell. Fail (and let the
    // job-alert signal in index.ts see it) only on the unambiguous case —
    // there was content to index and NONE of it landed — rather than on any
    // single degraded document, which stays a WARN/ERROR log, not a job
    // failure.
    const totalAttempted =
      docs.length + articleResult.length + pageResult.length;
    const totalLanded = successCount + articleSuccessCount + pageSuccessCount;
    if (totalAttempted > 0 && totalLanded === 0) {
      return yield* Effect.fail(
        new Error(
          `[search-sync] indexed 0/${totalAttempted} documents this sweep — treating the run as failed`,
        ),
      );
    }
  });
