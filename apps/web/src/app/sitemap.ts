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

const ARTICLE_SITEMAP_QUERY = `*[_type == "article" && defined(slug.current) && publishAt <= now() && (!defined(unpublishAt) || unpublishAt > now())] | order(publishAt desc) {
  "slug": slug.current,
  "updatedAt": _updatedAt
}`;

async function fetchArticleSlugs(): Promise<ArticleSitemapRow[]> {
  try {
    const { sanityClient } = await import("@/lib/sanity/client");
    return await sanityClient.fetch<ArticleSitemapRow[]>(ARTICLE_SITEMAP_QUERY);
  } catch {
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

  const articles = await fetchArticleSlugs();
  const articleEntries = articles.map((article) => ({
    url: `${SITE_CONFIG.siteUrl}/nieuws/${article.slug}`,
    lastModified: new Date(article.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...articleEntries];
}
