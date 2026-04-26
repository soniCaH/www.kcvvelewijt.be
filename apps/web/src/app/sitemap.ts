import type { MetadataRoute } from "next";

import { SITE_CONFIG } from "@/lib/constants";
const staticRoutes: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/nieuws", priority: 0.9, changeFrequency: "daily" },
  { path: "/ploegen", priority: 0.8, changeFrequency: "weekly" },
  { path: "/jeugd", priority: 0.8, changeFrequency: "weekly" },
  { path: "/sponsors", priority: 0.7, changeFrequency: "monthly" },
  { path: "/kalender", priority: 0.8, changeFrequency: "daily" },
  { path: "/zoeken", priority: 0.5, changeFrequency: "monthly" },
  { path: "/club", priority: 0.7, changeFrequency: "monthly" },
  { path: "/club/geschiedenis", priority: 0.6, changeFrequency: "yearly" },
  { path: "/club/organigram", priority: 0.6, changeFrequency: "monthly" },
  { path: "/club/ultras", priority: 0.6, changeFrequency: "monthly" },
  { path: "/club/contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
];

interface ArticleSitemapRow {
  slug: string;
  updatedAt: string;
}

interface EventSitemapRow {
  slug: string;
  updatedAt: string;
}

interface SlugRow {
  slug: string;
}

interface TeamSitemapRow {
  slug: string;
  psdId: string | null;
}

const ARTICLE_SITEMAP_QUERY = `*[_type == "article" && defined(slug.current) && publishAt <= now() && (!defined(unpublishAt) || unpublishAt > now())] | order(publishAt desc) {
  "slug": slug.current,
  "updatedAt": _updatedAt
}`;

// Events surface in the sitemap until their end-of-life is in the past.
// `coalesce(dateEnd, dateStart) > $cutoff` with a 24h grace window keeps
// same-day events (which often omit `dateEnd`) listed throughout the day
// they're happening — the cutoff is computed in JS because GROQ has no
// portable subtract-duration helper across Sanity API versions.
const EVENT_SITEMAP_QUERY = `*[_type == "event" && defined(slug.current) && coalesce(dateEnd, dateStart) > $cutoff] | order(dateStart asc) {
  "slug": slug.current,
  "updatedAt": _updatedAt
}`;

const PLAYER_SITEMAP_QUERY = `*[_type == "player" && archived != true && defined(psdId) && psdId != ""] {
  "slug": psdId
}`;

const STAFF_SITEMAP_QUERY = `*[_type == "staffMember" && archived != true && defined(psdId) && psdId != ""] {
  "slug": psdId
}`;

const TEAM_SITEMAP_QUERY = `*[_type == "team" && archived != true && showInNavigation != false && defined(slug.current)] {
  "slug": slug.current,
  psdId
}`;

async function fetchFromSanity<T>(
  query: string,
  label: string,
  params?: Record<string, unknown>,
): Promise<T[]> {
  try {
    const { sanityClient } = await import("@/lib/sanity/client");
    return await sanityClient.fetch<T[]>(query, params ?? {});
  } catch (error) {
    console.error(`[sitemap] ${label} failed:`, error);
    return [];
  }
}

async function fetchRecentMatchIds(teamPsdIds: string[]): Promise<number[]> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Intentional try/catch around runPromise: sitemap generation must degrade
  // gracefully rather than fail entirely. Inner Effect.catchTag("HttpNotFound")
  // silently handles missing teams; the inner Effect.catchAll logs unexpected
  // errors per team while allowing other teams to succeed. This outer try/catch
  // is a last-resort fallback for catastrophic failures (e.g. import errors,
  // runtime misconfiguration) — returns a partial sitemap instead of crashing.
  try {
    const { Effect } = await import("effect");
    const { runPromise } = await import("@/lib/effect/runtime");
    const { BffService } = await import("@/lib/effect/services/BffService");

    const validTeamIds = teamPsdIds
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));

    const effects = validTeamIds.map((teamId) =>
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getMatches(teamId);
      }).pipe(
        Effect.catchTag("HttpNotFound", () => Effect.succeed([] as const)),
        Effect.catchAll((error) => {
          console.error(
            `[sitemap] Failed to fetch matches for team ${teamId}:`,
            error,
          );
          return Effect.succeed([] as const);
        }),
      ),
    );

    const results = await runPromise(
      Effect.all(effects, { concurrency: "unbounded" }),
    );

    const allMatchIds: number[] = [];
    const now = new Date();
    for (const matches of results) {
      for (const match of matches) {
        if (match.date >= ninetyDaysAgo && match.date <= now) {
          allMatchIds.push(match.id);
        }
      }
    }

    return [...new Set(allMatchIds)];
  } catch (error) {
    console.error("[sitemap] fetchRecentMatchIds failed:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticEntries = staticRoutes.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${SITE_CONFIG.siteUrl}${path}`,
      lastModified,
      changeFrequency,
      priority,
    }),
  );

  const [articles, events, players, staff, teams] = await Promise.all([
    fetchFromSanity<ArticleSitemapRow>(
      ARTICLE_SITEMAP_QUERY,
      "fetchArticleSlugs",
    ),
    fetchFromSanity<EventSitemapRow>(EVENT_SITEMAP_QUERY, "fetchEventSlugs", {
      cutoff: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    }),
    fetchFromSanity<SlugRow>(PLAYER_SITEMAP_QUERY, "fetchPlayerSlugs"),
    fetchFromSanity<SlugRow>(STAFF_SITEMAP_QUERY, "fetchStaffSlugs"),
    fetchFromSanity<TeamSitemapRow>(TEAM_SITEMAP_QUERY, "fetchTeamSlugs"),
  ]);

  const articleEntries = articles.map((article) => ({
    url: `${SITE_CONFIG.siteUrl}/nieuws/${article.slug}`,
    lastModified: new Date(article.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const eventEntries = events.map((event) => ({
    url: `${SITE_CONFIG.siteUrl}/events/${event.slug}`,
    lastModified: new Date(event.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const playerEntries = players.map((p) => ({
    url: `${SITE_CONFIG.siteUrl}/spelers/${p.slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const staffEntries = staff.map((s) => ({
    url: `${SITE_CONFIG.siteUrl}/staf/${s.slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const teamEntries = teams.map((t) => ({
    url: `${SITE_CONFIG.siteUrl}/ploegen/${t.slug}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const teamPsdIds = teams
    .map((t) => t.psdId)
    .filter((id): id is string => id !== null && id !== "");
  const matchIds = await fetchRecentMatchIds(teamPsdIds);
  const matchEntries = matchIds.map((id) => ({
    url: `${SITE_CONFIG.siteUrl}/wedstrijd/${id}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [
    ...staticEntries,
    ...articleEntries,
    ...eventEntries,
    ...playerEntries,
    ...staffEntries,
    ...teamEntries,
    ...matchEntries,
  ];
}
