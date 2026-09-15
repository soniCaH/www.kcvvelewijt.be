import { Effect, Schedule } from "effect";
import { HARD_TTL_LONG } from "../cache/kv-cache";

// Same shape as sanity-index-sync.ts's UPSERT_RETRY — duplicated rather than
// imported, since sanity-index-sync.ts imports from this module and the
// reverse would be circular. Unifying the two retry schedules belongs to
// #2854 (consolidating this reconciliation shape with psd-sanity-sync's),
// not here.
const MANIFEST_RETRY = Schedule.exponential("100 millis").pipe(
  Schedule.jittered,
  Schedule.intersect(Schedule.recurs(3)),
);

/**
 * The manifest of ids the search index is believed to hold: a single KV
 * array value, written by the nightly sweep's reconciliation step
 * (`sanity-index-sync.ts`) — the sweep is its only writer.
 *
 * A sweep alone only ever observes "what matched a query during this sweep
 * window," which misses a document whose entire visible life fits between
 * two sweeps (an article published and unpublished the same day;
 * `unpublishAt` passing fires no webhook of its own, so nothing else would
 * ever record it left). The webhook's upsert path closes that gap — not by
 * writing the manifest array directly, but by dropping a put-only "pending"
 * marker per id (`pendingKey`, below), which the next sweep absorbs into the
 * manifest before diffing and then deletes (#2831, #2856). Two concurrent
 * webhooks for different ids write to two different marker keys, so there
 * is no shared read to race on and no last-write-wins — the lost-update
 * race a read-modify-write manifest update had is gone by construction, not
 * mitigated by retrying (a retry re-reads the same stale cached value and
 * loses the same way).
 *
 * Reads `PSD_CACHE` directly rather than through `KvCacheService`:
 * `KvCacheLive.get` swallows every KV error into the same `null` a genuinely
 * absent key returns, which is indistinguishable from "no manifest yet" —
 * and the caller treats that as license to write a fresh manifest, silently
 * forgetting everything the old one tracked on a transient KV blip (#2831).
 * `readManifest` below fails instead, so the caller can skip reconciliation
 * rather than mistake "unreadable" for "empty."
 *
 * Keyed per SANITY_DATASET: the local-dev KV preview namespace is
 * byte-identical to staging's `PSD_CACHE` namespace (`wrangler.toml`'s
 * `preview_id` vs `[[env.staging.kv_namespaces]].id`), so an unscoped key
 * would have a local `wrangler dev` sweep and staging read and write the
 * exact same manifest.
 *
 * Exported so tests can derive the exact key instead of hard-coding a
 * parallel copy of this string that could silently drift from it.
 */
export const manifestKey = (dataset: string) =>
  `search-index:manifest:${dataset}`;

/**
 * One id's pending-marker key. Put-only — the webhook writes it with no
 * read, so there is nothing to race with a concurrent write to a
 * *different* id's key. Writing the same marker twice (a re-edit of an
 * already-indexed document) is idempotent by construction: same key, same
 * value, no state to corrupt — unlike the old read-modify-write version,
 * nothing here needs an `includes` check to avoid a duplicate.
 */
const pendingKey = (dataset: string, id: string) =>
  `search-index:pending:${dataset}:${id}`;

const pendingKeyPrefix = (dataset: string) =>
  `search-index:pending:${dataset}:`;

export class ManifestError extends Error {
  readonly _tag = "ManifestError" as const;
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

// Reuses PSD_CACHE rather than provisioning a dedicated KV namespace for a
// ~200-id list plus a handful of pending markers: no new wrangler.toml
// binding, nothing for a human to create before merge.
// ponytail: revisit only if PSD_CACHE's own eviction policy (built for PSD
// response caching) ever conflicts with a value this manifest expects to
// persist indefinitely — HARD_TTL_LONG (365 days) is refreshed on every
// sweep write, and is also the marker TTL as a safety net if a sweep never
// runs to absorb one.

/**
 * Reads the manifest. An absent key is a genuine first run and resolves to
 * `[]`; a KV error, a non-JSON value, or valid JSON that isn't an array all
 * FAIL rather than resolve to `[]` — those three are "unreadable," not
 * "empty," and the caller must not treat them the same way (#2831).
 */
export const readManifest = (
  kv: KVNamespace,
  dataset: string,
): Effect.Effect<string[], ManifestError> =>
  Effect.tryPromise({
    try: () => kv.get(manifestKey(dataset)),
    catch: (cause) =>
      new ManifestError(`KV get failed: ${String(cause)}`, cause),
  }).pipe(
    Effect.flatMap((raw) => {
      if (raw === null) return Effect.succeed([] as string[]);
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch (cause) {
        return Effect.fail(
          new ManifestError(
            `manifest value is not valid JSON: ${String(cause)}`,
            cause,
          ),
        );
      }
      if (!Array.isArray(parsed)) {
        return Effect.fail(
          new ManifestError("manifest value is not a JSON array"),
        );
      }
      return Effect.succeed(
        parsed.filter((id): id is string => typeof id === "string"),
      );
    }),
  );

export const writeManifest = (
  kv: KVNamespace,
  dataset: string,
  ids: readonly string[],
): Effect.Effect<void, ManifestError> =>
  Effect.tryPromise({
    try: () =>
      kv.put(manifestKey(dataset), JSON.stringify(ids), {
        expirationTtl: HARD_TTL_LONG,
      }),
    catch: (cause) =>
      new ManifestError(`KV put failed: ${String(cause)}`, cause),
  });

/**
 * Marks an id as belonging in the manifest — the webhook's upsert path
 * calls this after a successful upsert so a document whose entire visible
 * life fits between two sweeps still gets tracked, and can therefore still
 * be pruned once it drops out.
 *
 * A single put to a per-id key (see `pendingKey` above), not a
 * read-modify-write of the manifest array — see the module docblock for
 * why that closes the concurrent-webhook lost-update race (#2856) rather
 * than just narrowing its window.
 *
 * Retries the put on a transient failure (same backoff as `UPSERT_RETRY`)
 * before giving up. Still never fails the caller even after retries
 * exhaust: this is best-effort bookkeeping riding along on a successful
 * index write, not something a KV blip should turn into a failed webhook
 * response — and the write already moved off that response path via
 * `ctx.waitUntil` (`webhooks/index-handler.ts`). Logged at ERROR once
 * retries are exhausted (not WARN) — by that point it's no longer routine.
 */
export const addToManifest = (
  kv: KVNamespace,
  dataset: string,
  id: string,
): Effect.Effect<void> =>
  Effect.tryPromise({
    try: () =>
      kv.put(pendingKey(dataset, id), "1", { expirationTtl: HARD_TTL_LONG }),
    catch: (cause) =>
      new ManifestError(`KV put failed: ${String(cause)}`, cause),
  })
    .pipe(Effect.retry(MANIFEST_RETRY))
    .pipe(
      Effect.catchAll((e) =>
        Effect.logError(
          `[index-manifest] giving up on manifest update for ${id} after retries: ${String(e)}`,
        ),
      ),
    );

/**
 * Lists every pending marker for this dataset, absorbed by the sweep before
 * it diffs (`sanity-index-sync.ts`) — see the module docblock. Paginates
 * via `list_complete`/`cursor` rather than assuming one page; the volume
 * between sweeps is normally tiny, but nothing here should silently drop
 * ids past KV's per-call `list` limit if it ever isn't.
 */
export const listPendingIds = (
  kv: KVNamespace,
  dataset: string,
): Effect.Effect<
  { readonly ids: string[]; readonly keys: string[] },
  ManifestError
> => {
  const prefix = pendingKeyPrefix(dataset);
  return Effect.tryPromise({
    try: async () => {
      const keys: string[] = [];
      let cursor: string | undefined;
      for (;;) {
        const page: {
          keys: { name: string }[];
          list_complete: boolean;
          cursor?: string;
        } = await kv.list({ prefix, cursor });
        for (const k of page.keys) keys.push(k.name);
        if (page.list_complete) break;
        cursor = page.cursor;
      }
      return keys;
    },
    catch: (cause) =>
      new ManifestError(`KV list failed: ${String(cause)}`, cause),
  }).pipe(
    Effect.map((keys) => ({
      keys,
      ids: keys.map((k) => k.slice(prefix.length)),
    })),
  );
};

/**
 * Deletes the pending-marker keys a sweep just absorbed into the manifest,
 * so they don't accumulate. Best-effort: a failed delete just means the
 * marker gets absorbed again next sweep — a no-op union, not a correctness
 * problem — so failures are logged and swallowed rather than propagated.
 */
export const deletePendingKeys = (
  kv: KVNamespace,
  keys: readonly string[],
): Effect.Effect<void> =>
  Effect.forEach(
    keys,
    (key) =>
      Effect.tryPromise({
        try: () => kv.delete(key),
        catch: (cause) =>
          new ManifestError(`KV delete failed: ${String(cause)}`, cause),
      }).pipe(
        Effect.catchAll((e) =>
          Effect.logWarning(
            `[index-manifest] failed to delete absorbed marker ${key}: ${String(e)}`,
          ),
        ),
      ),
    { concurrency: 5, discard: true },
  );
