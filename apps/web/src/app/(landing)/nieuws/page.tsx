/**
 * News Listing Page
 * One chronological 1 → 2 → 3 card grid with a load-more button, under a
 * sticky category filter bar.
 *
 * No route-segment `revalidate`: the page awaits `searchParams` for
 * `?categorie=`, so the segment is dynamic and a window would be inert (#2391).
 */

import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { degradeSection } from "@/lib/effect/degrade";
import { ArticleRepository } from "@/lib/repositories/article.repository";
import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { PageContainer } from "@/components/design-system";
import { PageHero } from "@/components/layout/PageHero";
import { LISTING_INITIAL_TOTAL } from "@/lib/constants";
import { NewsListingClient } from "./NewsListingClient";
import { fetchArticlesAction } from "./actions";

// Exported so `loading.tsx` can reuse the real, unshimmered opening (#2432
// §2 — static copy renders for real) without a second hand-typed copy that
// can silently drift from this one.
export const NEWS_KICKER = "KCVV Elewijt · Nieuws";
export const NEWS_HEADLINE = "Nieuwsarchief";

interface NewsPageProps {
  searchParams: Promise<{ categorie?: string }>;
}

export async function generateMetadata({
  searchParams,
}: NewsPageProps): Promise<Metadata> {
  const { categorie } = await searchParams;
  // Every ?categorie view canonicalizes to the unfiltered /nieuws listing so the
  // filtered permutations don't compete as duplicate URLs (SEO-3).
  return buildPageMetadata({
    title: categorie ? `${categorie} - Nieuwsarchief` : "Nieuwsarchief",
    description: categorie
      ? `Bekijk al het ${categorie} nieuws van KCVV Elewijt.`
      : "Bekijk al het nieuws van KCVV Elewijt. Filter op categorie of zoek naar specifieke artikelen.",
    path: "/nieuws",
  });
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const params = await searchParams;
  const categorySlug = params.categorie;

  // Fetch unique tags (lightweight) and initial paginated batch in parallel.
  // `ArticleRepository.findTags` is a Sanity read (`E = never`, #2863), so the
  // guard must be `degradeSection` — a plain `Effect.catchAll` type-checks but
  // never runs against it — and it degrades to an empty category list rather
  // than throwing.
  //
  // The article grid's own `.catch()` just below is unrelated: it is a
  // genuine Promise-level handler around `fetchArticlesAction`, not an
  // Effect-level guard, so it was never affected by the dead-`catchAll` bug
  // this ticket fixes and stays live either way. `fetchArticlesAction` itself
  // now deliberately leaves its Sanity read bare (#2863 review round 2,
  // finding 1) so this `.catch()` — and `NewsListingClient`'s own retry UI on
  // every later call — actually sees a rejection when the read fails, instead
  // of a silently-empty success.
  const [allTags, initialBatch] = await Promise.all([
    runPromise(
      degradeSection(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          const tags = yield* repo.findTags();
          return tags.filter((t: string | null): t is string => t != null);
        }),
        [] as string[],
        "[NewsPage] tags read failed; falling back to an empty category list.",
      ),
    ),
    fetchArticlesAction({
      offset: 0,
      limit: LISTING_INITIAL_TOTAL,
      category: categorySlug,
    }).catch((error) => {
      console.error("[NewsPage] Failed to fetch initial articles:", error);
      return { items: [], hasMore: false };
    }),
  ]);

  const categories = [...allTags].sort().map((tag) => ({
    id: tag,
    attributes: { name: tag, slug: tag },
  }));

  return (
    <>
      {/* The index announces itself. It shipped an `sr-only` <h1> as its only
          announcement until #2555 — the one route on the site with no visible
          opening at all. */}
      <PageContainer width="index" className="pt-12 sm:pt-16">
        <PageHero
          register="minimal"
          kicker={NEWS_KICKER}
          headline={NEWS_HEADLINE}
        />
      </PageContainer>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Nieuws", url: `${SITE_CONFIG.siteUrl}/nieuws` },
        ])}
      />
      <NewsListingClient
        initialArticles={initialBatch.items}
        categories={categories}
        hasMore={initialBatch.hasMore}
        initialCategory={categorySlug}
        fetchArticles={fetchArticlesAction}
      />
    </>
  );
}
