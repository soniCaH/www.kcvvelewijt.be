import { request } from "@playwright/test";

export const ARTICLE_TYPES = [
  "interview",
  "announcement",
  "transfer",
  "event",
] as const;
export type ArticleType = (typeof ARTICLE_TYPES)[number];

export interface RouteFixtures {
  /** First article slug for each known articleType, or null if none was found. */
  articleSlugByType: Record<ArticleType, string | null>;
  eventSlug: string | null;
  playerSlug: string | null;
  teamSlug: string | null;
  matchId: string | null;
}

const PATH_PREFIXES = {
  article: "/nieuws/",
  event: "/events/",
  player: "/spelers/",
  team: "/ploegen/",
  match: "/wedstrijd/",
} as const;

const HERO_TESTID_BY_TYPE: Record<ArticleType, string> = {
  interview: 'data-testid="interview-hero"',
  announcement: 'data-testid="announcement-hero"',
  transfer: 'data-testid="transfer-hero"',
  event: 'data-testid="event-hero"',
};

const ARTICLE_PROBE_BUDGET = 30;

interface SitemapEntry {
  pathname: string;
}

/**
 * Discover representative slugs for each dynamic-route family on the running
 * site. The site's `/sitemap.xml` is the source of truth — it lists every
 * article, event, player, team, and recent match. This keeps the e2e suite
 * resilient to CMS content changes without requiring Sanity credentials in
 * the test runtime.
 *
 * articleType is detected by fetching candidate article pages and matching
 * the type-specific hero `data-testid` attributes that already exist for
 * component-level tests. Up to `ARTICLE_PROBE_BUDGET` candidates are probed
 * before giving up on a missing type.
 */
export async function discoverRouteFixtures(
  baseURL: string,
): Promise<RouteFixtures> {
  const api = await request.newContext();
  try {
    const entries = await fetchSitemap(api, baseURL);

    const articleSlugByType: Record<ArticleType, string | null> = {
      interview: null,
      announcement: null,
      transfer: null,
      event: null,
    };

    const articleSlugs = slugsUnder(entries, PATH_PREFIXES.article);
    const probeCount = Math.min(articleSlugs.length, ARTICLE_PROBE_BUDGET);
    const probeResults = await Promise.all(
      articleSlugs.slice(0, probeCount).map(async (slug) => ({
        slug,
        type: await probeArticleType(api, baseURL, slug),
      })),
    );
    for (const { slug, type } of probeResults) {
      if (!type) continue;
      if (articleSlugByType[type] !== null) continue;
      articleSlugByType[type] = slug;
    }

    return {
      articleSlugByType,
      eventSlug: firstSlugUnder(entries, PATH_PREFIXES.event),
      playerSlug: firstSlugUnder(entries, PATH_PREFIXES.player),
      teamSlug: firstSlugUnder(entries, PATH_PREFIXES.team),
      matchId: firstSlugUnder(entries, PATH_PREFIXES.match),
    };
  } finally {
    await api.dispose();
  }
}

async function fetchSitemap(
  api: Awaited<ReturnType<typeof request.newContext>>,
  baseURL: string,
): Promise<SitemapEntry[]> {
  const response = await api.get(`${baseURL}/sitemap.xml`);
  if (!response.ok()) {
    throw new Error(
      `Failed to fetch sitemap.xml: ${response.status()} ${response.statusText()}`,
    );
  }
  const xml = await response.text();
  const matches = xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g);
  return Array.from(matches, (m) => ({ pathname: pathnameOf(m[1]) }));
}

function pathnameOf(loc: string): string {
  try {
    return new URL(loc).pathname;
  } catch {
    return "";
  }
}

function slugsUnder(entries: SitemapEntry[], prefix: string): string[] {
  const slugs: string[] = [];
  for (const entry of entries) {
    if (!entry.pathname.startsWith(prefix)) continue;
    const remainder = entry.pathname.slice(prefix.length).replace(/\/+$/, "");
    if (remainder.length === 0 || remainder.includes("/")) continue;
    slugs.push(remainder);
  }
  return slugs;
}

function firstSlugUnder(
  entries: SitemapEntry[],
  prefix: string,
): string | null {
  return slugsUnder(entries, prefix)[0] ?? null;
}

async function probeArticleType(
  api: Awaited<ReturnType<typeof request.newContext>>,
  baseURL: string,
  slug: string,
): Promise<ArticleType | null> {
  const response = await api.get(`${baseURL}/nieuws/${slug}`);
  if (!response.ok()) return null;
  const html = await response.text();
  for (const type of ARTICLE_TYPES) {
    if (html.includes(HERO_TESTID_BY_TYPE[type])) return type;
  }
  return null;
}
