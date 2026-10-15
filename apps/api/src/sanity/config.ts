import type { WorkerEnv } from "../env";

/**
 * Shared Sanity client config derived from worker env. `published` because the
 * token can read drafts and the default `raw` perspective returns `drafts.*`
 * next to the published document (#3477). Query requests only; mutations and
 * `getDocument` are unaffected. A query that must see drafts (the asset
 * reference count in `deleteAssetIfUnreferenced`) passes `perspective: "raw"`
 * per request.
 */
export const sanityClientConfig = (env: WorkerEnv) => ({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  apiVersion: "2024-01-01" as const,
  token: env.SANITY_API_TOKEN,
  perspective: "published" as const,
});
