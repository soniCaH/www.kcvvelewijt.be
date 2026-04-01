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

async function fetchFromSanity<T>(query: string, label: string): Promise<T[]> {
  try {
    const { sanityClient } = await import("@/lib/sanity/client");
    return await sanityClient.fetch<T[]>(query);
  } catch (error) {
    console.error(`[sitemap] ${label} failed:`, error);
    return [];
  }
}

async function fetchRecentMatchIds(teamPsdIds: string[]): Promise<number[]> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

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
      }).pipe(Effect.catchAll(() => Effect.succeed([] as const))),
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

  const [articles, players, staff, teams] = await Promise.all([
    fetchFromSanity<ArticleSitemapRow>(
      ARTICLE_SITEMAP_QUERY,
      "fetchArticleSlugs",
    ),
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
    ...playerEntries,
    ...staffEntries,
    ...teamEntries,
    ...matchEntries,
  ];
}
