import { createClient } from "@sanity/client";

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  useCdn: true,
  token: process.env.SANITY_API_READ_TOKEN,
  // Published-only: with a token and no perspective, @sanity/client v7 defaults
  // to "raw", which returns BOTH drafts and published documents. That leaks
  // unpublished edits into the live site — e.g. an in-progress Studio draft of a
  // team surfaced as a duplicate nav entry. The public site must never render
  // drafts. The one exception is preview mode (#3619): `fetchGroq` swaps in
  // `sanityPreviewClient` below, only for a request that carries the editor's
  // draft-mode cookie.
  perspective: "published",
});

/**
 * The same client reading unpublished changes: drafts perspective, no API CDN
 * (the CDN would serve a stale pre-edit answer). Only `fetchGroq` uses it, and
 * only while preview mode is on. Server-only — it carries the read token.
 */
export const sanityPreviewClient = sanityClient.withConfig({
  useCdn: false,
  perspective: "drafts",
});
