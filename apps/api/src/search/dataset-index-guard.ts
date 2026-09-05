import type { WorkerEnv } from "../env";

/**
 * The single hardcoded source of truth for which Vectorize index each
 * SANITY_DATASET is allowed to write to. wrangler.toml must agree with it
 * for every environment: `[[vectorize]].index_name` and the matching
 * `SEARCH_INDEX_NAME` var must both equal the value here for that
 * environment's dataset. A wrangler.toml edit that changes one of those
 * three without the other two — e.g. reverting `index_name` back to
 * "kcvv-search" on staging while leaving `SEARCH_INDEX_NAME` alone — is
 * exactly what this map, and `datasetIndexMismatch` below, exist to catch
 * instead of trusting the config file to stay internally consistent (#2833).
 *
 * `webhooks/wrangler-config.test.ts` asserts wrangler.toml agrees with this
 * map for both environments — the worker cannot ask its own SEARCH_INDEX
 * binding which index it is actually pointed at (Wrangler never exposes
 * that at runtime), so a test that reads the config file directly is the
 * only place left to check the pairing this map assumes is true.
 */
export const EXPECTED_INDEX_BY_DATASET: Record<string, string> = {
  production: "kcvv-search",
  staging: "kcvv-search-staging",
};

/**
 * Returns a human-readable reason when this worker's SANITY_DATASET and its
 * declared SEARCH_INDEX_NAME disagree with EXPECTED_INDEX_BY_DATASET, or
 * null when they agree. An absent SEARCH_INDEX_NAME fails closed — it is
 * never treated as "assume production."
 *
 * Shared by every writer of the SEARCH_INDEX binding — the webhook
 * (`webhooks/index-handler.ts`) and the nightly bulk sync
 * (`search/sanity-index-sync.ts`) — so a misconfigured worker refuses both
 * paths. Gating only the webhook left the bulk sync exposed to the exact
 * "no cron on staging" reasoning #2833 was filed to retire: that reasoning
 * covers the sync's *trigger* (crons are `[]` on staging), not what happens
 * the day something does trigger it.
 */
export function datasetIndexMismatch(env: WorkerEnv): string | null {
  const expected = EXPECTED_INDEX_BY_DATASET[env.SANITY_DATASET];
  if (!expected) {
    return `no known Vectorize index is registered for SANITY_DATASET "${env.SANITY_DATASET}"`;
  }
  if (env.SEARCH_INDEX_NAME !== expected) {
    return `SANITY_DATASET "${env.SANITY_DATASET}" must write to index "${expected}", but SEARCH_INDEX_NAME is "${env.SEARCH_INDEX_NAME ?? "unset"}"`;
  }
  return null;
}
