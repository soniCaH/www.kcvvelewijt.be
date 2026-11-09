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
 * The one subject that cannot be pinned: a match is a PSD record, not a
 * Sanity document. It is read off the pinned team's season list each run —
 * one GET, no page probing. Not the sitemap: that lists only the last 7 days
 * (`apps/web/src/app/sitemap.ts`), so any week without a match turned this red
 * (#3625). The season list keeps past and future matches, winter break included.
 */
export async function discoverMatchId(
  request: APIRequestContext,
): Promise<string | null> {
  const path = `/ploegen/${FIXTURES.teamSlug}/wedstrijden`;
  const response = await request.get(path);
  if (!response.ok()) {
    throw new Error(`Failed to fetch ${path}: ${response.status()}`);
  }
  return matchIdIn(await response.text());
}

/** The first `/wedstrijd/<id>` link in an HTML body, or `null`. */
export function matchIdIn(html: string): string | null {
  return html.match(/href="\/wedstrijd\/([^/"?#]+)/)?.[1] ?? null;
}
