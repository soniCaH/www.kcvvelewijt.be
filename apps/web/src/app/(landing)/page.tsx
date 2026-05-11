/**
 * Homepage
 * Main landing page for KCVV Elewijt website
 *
 * Phase 4.D.1 (#1680) — section ordering rewired to the locked retro
 * composition. Per-section components own their own backgrounds and
 * editorial chrome, so `<SectionStack>` uses `bg: "transparent"` (no
 * inter-section diagonal transitions) for those sections and
 * `bg: "gray-100"` for the legacy `<BannerSlot>` strips.
 */

import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import {
  ArticleRepository,
  type ArticleVM,
  toHomepageArticles,
} from "@/lib/repositories/article.repository";
import { HomepageRepository } from "@/lib/repositories/homepage.repository";
import {
  EventRepository,
  type EventVM,
} from "@/lib/repositories/event.repository";
import { BffService } from "@/lib/effect/services/BffService";
import {
  BannerSlot,
  FeaturedEventBand,
  HomepageHeroCarousel,
  type FeaturedEventBandEvent,
  type HomepageHeroArticle,
  NewsGrid,
  SponsorsSection,
  UpcomingMatches,
  WebshopBanner,
  YouthBackdrop,
  YouthSection,
} from "@/components/home";
import { SectionStack } from "@/components/design-system";
import type { SectionConfig } from "@/components/design-system";
import { mapMatchesToUpcomingMatches } from "@/lib/mappers";
import { DEFAULT_OG_IMAGE, SITE_CONFIG } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildSportsClubJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Er is maar één plezante compagnie | KCVV Elewijt";
  const description = "Startpagina van stamnummer 00055: KCVV Elewijt.";
  return {
    title,
    description,
    keywords:
      "KCVV, Voetbal, Elewijt, Crossing, KCVVE, Zemst, 00055, 55, 1982, 1980",
    openGraph: {
      title,
      description,
      url: SITE_CONFIG.siteUrl,
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

function toHeroCarouselArticle(article: ArticleVM): HomepageHeroArticle {
  return {
    slug: article.slug,
    // ARTICLES_QUERY does not project `articleType` today; default to
    // "announcement" until the projection grows (out of scope for #1680).
    variant: "announcement",
    title: article.title,
    coverImage: article.coverImageUrl
      ? { url: article.coverImageUrl, alt: article.title }
      : undefined,
    thumbLabel: article.tags[0],
  };
}

function toFeaturedEventBandEvent(
  event: EventVM | null,
): FeaturedEventBandEvent | null {
  if (!event || !event.dateStart) return null;
  const isExternalLink = event.href && event.href !== "#" && event.href !== "";
  return {
    title: event.title,
    slug: event.slug,
    dateStart: event.dateStart,
    dateEnd: event.dateEnd ?? null,
    coverImage: event.coverImageUrl
      ? { url: event.coverImageUrl, alt: event.title }
      : null,
    externalLink: isExternalLink ? { url: event.href, label: null } : null,
  };
}

export default async function HomePage() {
  const [articlesResult, matchesResult, bannersResult, featuredEventResult] =
    await Promise.all([
      runPromise(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          const all = yield* repo.findAll();
          // Slice [0..8] — first 3 fill the hero carousel, next 5 the news grid.
          return all.slice(0, 8);
        }).pipe(Effect.catchAll(() => Effect.succeed<ArticleVM[]>([]))),
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
          const repo = yield* EventRepository;
          return yield* repo.findNextFeatured();
        }).pipe(Effect.catchAll(() => Effect.succeed<EventVM | null>(null))),
      ),
    ]);

  const articles = articlesResult;
  const matches = matchesResult;
  const banners = bannersResult;
  const featuredEvent = featuredEventResult;

  const heroArticles = articles.slice(0, 3).map(toHeroCarouselArticle);
  const newsGridArticles = toHomepageArticles(articles.slice(3, 8));
  const upcomingMatches = mapMatchesToUpcomingMatches(matches);
  const featuredEventBandEvent = toFeaturedEventBandEvent(featuredEvent);

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

  // For self-contained sections (their own <section className="bg-..."> + py-*)
  // we set pt-0/pb-0 on the SectionStack wrapper so its default pt-20/pb-20
  // doesn't paint a transparent strip (= body bg = white) above and below
  // the component's own coloured surface.
  const heroSection: SectionConfig | null =
    heroArticles.length > 0
      ? {
          key: "hero",
          bg: "transparent",
          content: <HomepageHeroCarousel articles={heroArticles} />,
          paddingTop: "pt-0",
          paddingBottom: "pb-0",
        }
      : null;

  const featuredEventSection: SectionConfig | null = featuredEventBandEvent
    ? {
        key: "featured-event",
        bg: "transparent",
        content: <FeaturedEventBand event={featuredEventBandEvent} />,
        paddingTop: "pt-0",
        paddingBottom: "pb-0",
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
        }
      : null;

  const upcomingMatchesSection: SectionConfig | null =
    upcomingMatches.length > 0
      ? {
          key: "upcoming-matches",
          bg: "transparent",
          content: <UpcomingMatches matches={upcomingMatches} />,
          paddingTop: "pt-0",
          paddingBottom: "pb-0",
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
      }
    : null;

  const youthSection: SectionConfig = {
    key: "youth",
    bg: "kcvv-green-dark",
    content: <YouthSection />,
    backdrop: <YouthBackdrop />,
  };

  const webshopSection: SectionConfig = {
    key: "webshop",
    bg: "transparent",
    content: <WebshopBanner />,
    paddingTop: "pt-0",
    paddingBottom: "pb-0",
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
      }
    : null;

  const sponsorsSection: SectionConfig = {
    key: "sponsors",
    bg: "transparent",
    content: <SponsorsSection />,
    paddingTop: "pt-0",
    paddingBottom: "pb-0",
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
        // Last section's bg is owned by `<SponsorsBlock>` (cream-deep). The
        // default footer safe-area padding paints with the SectionStack
        // wrapper's `bg: "transparent"`, leaving a white strip between the
        // sponsor grid and the footer; disable it so SponsorsBlock connects
        // directly to the footer's cream bg.
        reserveFooterSafeArea={false}
        sections={[
          heroSection,
          featuredEventSection,
          bannerSlotASection,
          latestNewsSection,
          upcomingMatchesSection,
          bannerSlotBSection,
          youthSection,
          webshopSection,
          bannerSlotCSection,
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
