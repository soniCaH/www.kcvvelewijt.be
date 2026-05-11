/**
 * Homepage
 * Main landing page for KCVV Elewijt website
 */

import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import {
  ArticleRepository,
  toHomepageArticles,
} from "@/lib/repositories/article.repository";
import { HomepageRepository } from "@/lib/repositories/homepage.repository";
import { BffService } from "@/lib/effect/services/BffService";
import {
  FeaturedArticles,
  NewsGrid,
  MatchWidget,
  BannerSlot,
  MatchesSliderSection,
  YouthSection,
  YouthBackdrop,
  WebshopBanner,
  SponsorsSection,
} from "@/components/home";
import { SectionStack } from "@/components/design-system";
import type { SectionConfig } from "@/components/design-system";
import { mapMatchesToUpcomingMatches } from "@/lib/mappers";
import { SITE_CONFIG } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildSportsClubJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import type { Metadata } from "next";

/**
 * Provide metadata for the homepage.
 *
 * @returns The page metadata object containing `title`, `description`, and `keywords`.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Er is maar één plezante compagnie | KCVV Elewijt",
    description: "Startpagina van stamnummer 00055: KCVV Elewijt.",
    keywords:
      "KCVV, Voetbal, Elewijt, Crossing, KCVVE, Zemst, 00055, 55, 1982, 1980",
  };
}

export default async function HomePage() {
  const [
    articlesResult,
    matchesResult,
    bannersResult,
    matchesSliderPlaceholderResult,
  ] = await Promise.all([
    runPromise(
      Effect.gen(function* () {
        const repo = yield* ArticleRepository;
        const all = yield* repo.findAll();
        // Phase 4 (#1672) — slice changes from [0..9] (6 grid articles) to
        // [0..8] (5 grid articles) per locked NewsGrid spec.
        return all.slice(0, 8);
      }).pipe(Effect.catchAll(() => Effect.succeed([]))),
    ),
    runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getNextMatches();
      }).pipe(
        Effect.catchAll((error) => {
          console.error("[HomePage] Failed to fetch matches:", error);
          return Effect.succeed([]);
        }),
      ),
    ),
    runPromise(
      Effect.gen(function* () {
        const repo = yield* HomepageRepository;
        return yield* repo.getBanners();
      }).pipe(
        Effect.catchAll(() =>
          Effect.succeed({
            bannerSlotA: null,
            bannerSlotB: null,
            bannerSlotC: null,
          }),
        ),
      ),
    ),
    runPromise(
      Effect.gen(function* () {
        const repo = yield* HomepageRepository;
        return yield* repo.getPlaceholder();
      }).pipe(Effect.catchAll(() => Effect.succeed(null))),
    ),
  ]);

  const articles = articlesResult;
  const matches = matchesResult;
  const banners = bannersResult;
  const matchesSliderPlaceholder = matchesSliderPlaceholderResult;

  const featuredArticles = toHomepageArticles(articles.slice(0, 3));
  // Phase 4 (#1672) — NewsGrid takes articles[3..8] (5) per locked spec.
  const newsGridArticles = toHomepageArticles(articles.slice(3, 8));

  const upcomingMatches = mapMatchesToUpcomingMatches(matches);
  const nextMatch = upcomingMatches[0];

  const sliderMatches = upcomingMatches.map((m) => ({
    ...m,
    teamLabel: m.kcvvTeamLabel,
  }));

  if (articles.length === 0 && matches.length === 0) {
    return (
      <div className="max-w-inner-lg mx-auto px-3 py-16 text-center lg:px-0">
        <h1 className="text-kcvv-green-dark mb-4 text-3xl font-bold lg:text-4xl">
          Welkom bij KCVV Elewijt
        </h1>
        <p className="text-lg text-gray-600">
          Inhoud kan momenteel niet worden geladen. Probeer het later opnieuw.
        </p>
      </div>
    );
  }

  const heroSection: SectionConfig | false = featuredArticles.length > 0 && {
    key: "hero",
    bg: "kcvv-black",
    content: (
      <FeaturedArticles
        articles={featuredArticles}
        autoRotate={true}
        autoRotateInterval={5000}
      />
    ),
    paddingTop: "pt-0",
    paddingBottom: "pb-0",
    transition: {
      type: "double-diagonal",
      direction: "right",
      via: "white",
      overlap: "half",
    },
  };

  const matchWidgetSection: SectionConfig | null = nextMatch
    ? {
        key: "match-widget",
        bg: "kcvv-green-dark",
        content: (
          <MatchWidget match={nextMatch} teamLabel={nextMatch.kcvvTeamLabel} />
        ),
        transition: { type: "diagonal", direction: "left" },
      }
    : null;

  const bannerSlotASection: SectionConfig | null = banners.bannerSlotA
    ? {
        key: "banner-a",
        bg: "gray-100",
        content: (
          <BannerSlot
            image={banners.bannerSlotA.imageUrl}
            alt={banners.bannerSlotA.alt}
            href={banners.bannerSlotA.href}
          />
        ),
        paddingTop: "pt-0",
        paddingBottom: "pb-0",
        transition: { type: "diagonal", direction: "left" },
      }
    : null;

  const latestNewsSection: SectionConfig | null =
    newsGridArticles.length > 0
      ? {
          key: "latest-news",
          bg: "gray-100",
          content: (
            <NewsGrid
              articles={newsGridArticles}
              title="Laatste nieuws"
              showViewAll
              viewAllHref="/nieuws"
            />
          ),
          transition: { type: "diagonal", direction: "left" },
        }
      : null;

  const bannerSlotBSection: SectionConfig | null = banners.bannerSlotB
    ? {
        key: "banner-b",
        bg: "gray-100",
        content: (
          <BannerSlot
            image={banners.bannerSlotB.imageUrl}
            alt={banners.bannerSlotB.alt}
            href={banners.bannerSlotB.href}
          />
        ),
        paddingTop: "pt-0",
        paddingBottom: "pb-0",
        transition: { type: "diagonal", direction: "left" },
      }
    : null;

  const matchesSliderSection: SectionConfig = {
    key: "matches-slider",
    bg: "kcvv-black",
    content: (
      <MatchesSliderSection
        matches={sliderMatches}
        highlightTeamId={1235}
        placeholder={matchesSliderPlaceholder}
      />
    ),
    transition: { type: "diagonal", direction: "right" },
  };

  const youthSection: SectionConfig = {
    key: "youth",
    bg: "kcvv-green-dark",
    content: <YouthSection />,
    backdrop: <YouthBackdrop />,
    transition: { type: "diagonal", direction: "left" },
  };

  const bannerSlotCSection: SectionConfig | null = banners.bannerSlotC
    ? {
        key: "banner-c",
        bg: "gray-100",
        content: (
          <BannerSlot
            image={banners.bannerSlotC.imageUrl}
            alt={banners.bannerSlotC.alt}
            href={banners.bannerSlotC.href}
          />
        ),
        paddingTop: "pt-0",
        paddingBottom: "pb-0",
        transition: { type: "diagonal", direction: "right" },
      }
    : null;

  const webshopSection: SectionConfig = {
    key: "webshop",
    bg: "gray-100",
    content: <WebshopBanner />,
    transition: { type: "diagonal", direction: "right" },
  };

  const sponsorsSection: SectionConfig = {
    key: "sponsors",
    bg: "kcvv-black",
    content: <SponsorsSection />,
    paddingTop: "pt-8",
    paddingBottom: "pb-8",
    transition: { type: "diagonal", direction: "left" },
  };

  return (
    <>
      <h1 className="sr-only">KCVV Elewijt</h1>
      <JsonLd data={buildSportsClubJsonLd()} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
        ])}
      />
      <SectionStack
        sections={[
          heroSection,
          matchWidgetSection,
          bannerSlotASection,
          latestNewsSection,
          bannerSlotBSection,
          matchesSliderSection,
          youthSection,
          bannerSlotCSection,
          webshopSection,
          sponsorsSection,
        ]}
      />
    </>
  );
}

/**
 * Enable ISR with 1 hour revalidation
 */
export const revalidate = 3600;
