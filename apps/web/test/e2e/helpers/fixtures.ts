import type { APIRequestContext } from "@playwright/test";

export const ARTICLE_TYPES = [
  "interview",
  "announcement",
  "transfer",
  "event",
] as const;
export type ArticleType = (typeof ARTICLE_TYPES)[number];

/**
 * The suite's fixed subjects in the `staging` dataset — the E2E data contract
 * (#3087). The workflow builds against `staging`; so must a local run.
 *
 * The first six are the fixture documents that
 * `apps/studio/scripts/seed-e2e-fixtures.ts` writes (#3147). If one is
 * missing, re-run that script. The player and the team are real staging
 * documents, pinned as they exist ("pin what exists", #3087 §3): nothing
 * syncs staging, so they do not move.
 */
export const FIXTURES = {
  articleSlugByType: {
    interview: "e2e-interview",
    announcement: "e2e-announcement",
    transfer: "e2e-transfer",
    event: "e2e-event",
  } satisfies Record<ArticleType, string>,
  eventSlug: "e2e-event-far-future",
  gallerySlug: "e2e-photo-gallery",
  /** Glenn Breugelmans, first team — `/spelers/[psdId]`. */
  playerSlug: "778",
  teamSlug: "eerste-elftallen-a",
} as const;

/**
 * The one subject that cannot be pinned. A match is a PSD record, not a
 * Sanity document, and the sitemap only lists matches of the last 90 days
 * (`apps/web/src/app/sitemap.ts`) — every match ages out of its own window.
 * So it is read off the sitemap each run: one GET, no page probing.
 */
export async function discoverMatchId(
  request: APIRequestContext,
): Promise<string | null> {
  const response = await request.get("/sitemap.xml");
  if (!response.ok()) {
    throw new Error(`Failed to fetch sitemap.xml: ${response.status()}`);
  }
  const xml = await response.text();
  return xml.match(/<loc>[^<]*\/wedstrijd\/([^/<\s]+)\s*<\/loc>/)?.[1] ?? null;
}
