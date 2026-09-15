import { Effect } from "effect";
import { HARD_TTL_LONG } from "../cache/kv-cache";

/**
 * The manifest of ids the search index is believed to hold: a single KV
 * array value.
 *
 * Ownership (#2855): `VectorizeServiceLive` (`./vectorize.ts`) is the
 * **only** writer — it adds an id here the moment its `upsert` is confirmed
 * by Vectorize, and removes one the moment its `deleteByIds` is confirmed.
 * Both the nightly sweep (`sanity-index-sync.ts`) and the webhook
 * (`webhooks/index-handler.ts`) write the index exclusively through that
 * service, so "an upsert adds the id" and "only a confirmed delete removes
 * it" are now structural — there is no second call site that could forget
 * either rule. The sweep still *reads* this module directly (below) to
 * diff its freshly-fetched current ids against what the manifest believes
 * is indexed, but it never writes it.
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
 * exact same manifest. Getting this scoping wrong is exactly what #2833
 * was about — `VectorizeServiceLive` reads `env.SANITY_DATASET` the same
 * way the sweep does, so a staging worker and a production worker never
 * share a key even though `manifestKey` itself has no idea which one is
 * calling it.
 *
 * Exported so tests can derive the exact key instead of hard-coding a
 * parallel copy of this string that could silently drift from it.
 */
export const manifestKey = (dataset: string) =>
  `search-index:manifest:${dataset}`;

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
// ~200-id list: no new wrangler.toml binding, nothing for a human to create
// before merge.
// ponytail: revisit only if PSD_CACHE's own eviction policy (built for PSD
// response caching) ever conflicts with a value this manifest expects to
// persist indefinitely — HARD_TTL_LONG (365 days) is refreshed on every
// write.

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
