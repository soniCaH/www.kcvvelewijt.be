import { Config, Redacted } from "effect";
import { sanityApiToken, sanityDataset, sanityProjectId } from "../config";

/**
 * Shared Sanity client config derived from the worker's vars. `published`
 * because the token can read drafts and the default `raw` perspective returns
 * `drafts.*` next to the published document (#3477). Query requests only;
 * mutations and `getDocument` are unaffected. A query that must see drafts (the
 * asset reference count in `deleteAssetIfUnreferenced`) passes
 * `perspective: "raw"` per request.
 */
export const sanityClientConfig = Config.all({
  projectId: sanityProjectId,
  dataset: sanityDataset,
  token: sanityApiToken,
}).pipe(
  Config.map(({ projectId, dataset, token }) => ({
    projectId,
    dataset,
    apiVersion: "2024-01-01" as const,
    token: Redacted.value(token),
    perspective: "published" as const,
  })),
);
