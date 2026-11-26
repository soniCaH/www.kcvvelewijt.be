import { createClient, type SanityClient } from "@sanity/client";
import { Config, Effect, Either, Redacted } from "effect";
import {
  logConfigError,
  sanityApiToken,
  sanityDataset,
  sanityProjectId,
} from "../config";

/**
 * Shared Sanity client config derived from the worker's vars. `published`
 * because the token can read drafts and the default `raw` perspective returns
 * `drafts.*` next to the published document (#3477). Query requests only;
 * mutations and `getDocument` are unaffected. A query that must see drafts (the
 * asset reference count in `deleteAssetIfUnreferenced`) passes
 * `perspective: "raw"` per request.
 *
 * The token is optional: without one the client reads anonymously, as it
 * always has (`.dev.vars.example` ships it empty).
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
    token: token === undefined ? undefined : Redacted.value(token),
    perspective: "published" as const,
  })),
);

/**
 * A Sanity client built on first use. A service layer calls this while it is
 * built, and every request builds the whole app layer, so a missing
 * SANITY_PROJECT_ID or SANITY_DATASET must not fail there (#3880): it fails the
 * call that touches Sanity, which throws the ConfigError naming the var inside
 * its own `tryPromise`. The error is logged once per build.
 */
export const makeSanityClient = Effect.map(
  sanityClientConfig.pipe(Effect.tapError(logConfigError), Effect.either),
  (config) => {
    const holder: { client?: SanityClient } = {};
    return (): SanityClient => {
      if (Either.isLeft(config)) throw config.left;
      return (holder.client ??= createClient({
        ...config.right,
        useCdn: false,
      }));
    };
  },
);
