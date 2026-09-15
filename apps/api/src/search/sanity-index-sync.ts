import { createClient } from "@sanity/client";
import { Array as Arr, Effect, Either, Schedule } from "effect";
import { WorkerEnvTag } from "../env";
import { reconcileOrphans } from "../reconciliation";
import { sanityClientConfig } from "../sanity/config";
import { datasetIndexMismatch } from "./dataset-index-guard";
import { EmbeddingService } from "./embedding";
import { readManifest } from "./index-manifest";
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
// worker already knows, so "what should be pruned" has to come from two
// sources other than the index itself:
//
// 1. A KV manifest (index-manifest.ts) of ids the index is believed to
//    hold. `VectorizeServiceLive` (search/vectorize.ts, #2855) is its only
//    writer: it adds an id there the instant its own `upsert` confirms
//    that id landed, and removes one the instant its own `deleteByIds`
//    confirms it's gone — for every caller, this sweep's own upserts below
//    included, not just the webhook's. That's what makes
//    `previousManifest − currentIds` (captured BEFORE this sweep's phases
//    run, see `manifestRead` above) safe to treat as "believed indexed as
//    of the last write, sweep or webhook" — a document whose entire
//    visible life fit between two sweeps (published and unpublished the
//    same day) is already tracked the moment the webhook's upsert lands,
//    with no absorption step needed to fold it in later.
// 2. The excluded-ids queries above — stateless and authoritative, so they
//    also catch a document excluded before the manifest ever tracked it (a
//    responsibility deactivated pre-dating this mechanism's first write).
//
// Only ids Vectorize actually confirms deleting leave the manifest — a dry
// run, a failed delete chunk, or a cap refusal all confirm nothing, so
// those ids stay tracked for the next sweep to retry deleting. This sweep
// never writes the manifest itself: every add and every remove below flows
// through `vectorize.upsert`/`vectorize.deleteByIds`, which is the only
// thing touching KV on the manifest's behalf.
//
// What NEITHER source covers: a vector already in the index whose Sanity
// document is ALSO already gone, from before this mechanism's first
// manifest write. Nothing can name that id after the fact — Vectorize has
// no list-ids call, and Sanity no longer has the document either. Cleaning
// up that pre-existing population is a separate, one-off, manually-run
// exercise (see the PR description for the measured count).
//
// Cost per sweep: 2 extra GROQ reads (excluded ids) + 1 KV read (the
// manifest, currently ~166 ids / ~6.5 KB, far under KV's 25 MB value cap),
// plus ceil(prunedCount / MAX_VECTORS_PER_UPSERT) additional deleteByIds
// calls. Negligible against the ~175-subrequest sweep this corpus already
// makes, dominated by embed calls.

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

    // Captured now, before any phase below runs its own upserts —
    // VectorizeServiceLive (#2855) maintains this manifest itself, adding
    // an id the moment its upsert lands, so reading it after the phases run
    // would already reflect THIS sweep's own additions instead of "believed
    // indexed as of the last write." Reading it here keeps the diff below
    // meaning what it always meant. A read failure is carried forward as an
    // Either rather than resolved here, so the phases still run — indexing
    // must not stop just because reconciliation can't.
    const manifestRead = yield* Effect.either(
      readManifest(env.PSD_CACHE, env.SANITY_DATASET),
    );

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

      if (Either.isLeft(manifestRead)) {
        yield* Effect.logWarning(
          `[search-sync] Skipping reconciliation — manifest read failed, leaving it untouched: ${String(manifestRead.left)}`,
        );
      } else {
        const previousManifest = manifestRead.right;

        // The manifest-diff portion goes through the shared reconciliation
        // guard (#2854, `../reconciliation.ts`) — same helper
        // `sync/psd-sanity-sync.ts` uses. droppedFromManifest is an
        // INFERENCE from a diff — a truncated or regressed fetch can
        // inflate it, which is exactly what the safety cap guards against.
        //
        // The excluded-ids sets below are handled separately, NOT through
        // this helper: they're AUTHORITATIVE (Sanity directly confirming
        // "this document exists and does not match"), so a truncated
        // excluded-ids fetch can only yield FEWER deletes, never more, and
        // must never be subject to the cap — folding them into the same
        // diff/cap call would let a legitimately huge excluded-ids set trip
        // the manifest-diff cap it has nothing to do with (see the
        // "scoped independently" test). They also recur in every sweep's
        // delete set by design: nothing removes an id from Sanity's
        // exclusion set once excluded, and deleteByIds on an id Vectorize no
        // longer holds is a documented no-op, so re-sending them costs
        // nothing worth tracking state to avoid.
        const manifestReconciliation = yield* reconcileOrphans(
          "manifest entries",
          previousManifest,
          new Set(currentIds),
          (ids) =>
            dryRun
              ? Effect.log(
                  `[search-sync] DRY RUN — would prune ${ids.length} orphaned vector(s): ${ids.join(", ")}`,
                ).pipe(Effect.as([] as string[]))
              : deleteBatched(ids).pipe(
                  Effect.tap((confirmed) =>
                    Effect.log(
                      `[search-sync] Pruned ${confirmed.length} orphaned vector(s)`,
                    ),
                  ),
                ),
          {
            ratioThreshold: PRUNE_SAFETY_CAP_FRACTION,
            floor: PRUNE_SAFETY_FLOOR,
            logPrefix: "[search-sync] ",
            releaseLeverHint:
              'see apps/api/CLAUDE.md ("Releasing a stuck prune safety cap") for the release lever once the cause is understood.',
          },
        );
        const manifestConfirmedIds =
          manifestReconciliation.action === "removed"
            ? manifestReconciliation.confirmedIds
            : [];
        const manifestConfirmedIdSet = new Set(manifestConfirmedIds);

        // Subtract ids the manifest-diff call above already confirmed
        // removed — a document deactivated between sweeps is commonly BOTH
        // a manifest orphan and an excluded id, and without this the same
        // id goes to deleteByIds twice in one sweep, and the two "Pruned N"
        // logs double-count it (#2854 review). Requested-but-NOT-confirmed
        // ids (a capped or failed manifest-diff delete) are deliberately
        // NOT subtracted — the excluded-ids query is authoritative and
        // uncapped, so it's still this sweep's only chance to retry them.
        const excludedIds = [
          ...new Set([...excludedResponsibilityIds, ...excludedArticleIds]),
        ].filter((id) => !manifestConfirmedIdSet.has(id));
        if (excludedIds.length > 0) {
          if (dryRun) {
            yield* Effect.log(
              `[search-sync] DRY RUN — would prune ${excludedIds.length} excluded-ids vector(s): ${excludedIds.join(", ")}`,
            );
          } else {
            const excludedConfirmedIds = yield* deleteBatched(excludedIds);
            yield* Effect.log(
              `[search-sync] Pruned ${excludedConfirmedIds.length} excluded-ids vector(s)`,
            );
          }
        } else {
          yield* Effect.log(
            "[search-sync] reconciliation: no orphan excluded ids to prune",
          );
        }

        // No manifest write here: `deleteBatched` above calls
        // `vectorize.deleteByIds`, and every currentId this sweep's earlier
        // phases upserted already went through `vectorize.upsert` — both
        // already updated the manifest as each call was confirmed
        // (`VectorizeServiceLive`, #2855). There is nothing left for this
        // sweep to write.
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
