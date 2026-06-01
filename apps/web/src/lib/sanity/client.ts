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
  // drafts; there is no draft-preview route that relies on them.
  perspective: "published",
});
