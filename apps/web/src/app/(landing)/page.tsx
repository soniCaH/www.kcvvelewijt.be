/**
 * Homepage
 * Main landing page for KCVV Elewijt website
 *
 * Phase 4.5.C.1 (#1754) — R4.B spine reorder + R1.B static-hero
 * retirement of `<HomepageHeroCarousel>`. The hero is now a single
 * static `<EditorialHero placement="homepage">` rendering the top
 * featured article; positions 2..4 of the featured-ordered query fill
 * the new `<FeaturedUitgelichtRow>`; `<ClubshopBanner>` slides to the
 * bottom of the spine (after `<SponsorsSection>`), with `<BannerSlot c>`
 * promoted to sit between Youth and Sponsors.
 *
 * Per-section components own their own backgrounds and editorial
 * chrome, so `<SectionStack>` uses `bg: "transparent"` for those
 * sections and `bg: "gray-100"` for the legacy `<BannerSlot>` strips.
 */

import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import {
  ArticleRepository,
  type ArticleVM,
  toHomepageArticles,
} from "@/lib/repositories/article.repository";
import { formatArticleDate } from "@/lib/utils/dates";
import { HomepageRepository } from "@/lib/repositories/homepage.repository";
import {
  EventRepository,
  type EventVM,
} from "@/lib/repositories/event.repository";
import { BffService } from "@/lib/effect/services/BffService";
import {
  BannerSlot,
  FeaturedEventBand,
  FeaturedUitgelichtRow,
  type FeaturedEventBandEvent,
  type UitgelichtArticle,
  type ArticleType as UitgelichtArticleType,
  NewsGrid,
  SponsorsSection,
  UpcomingMatches,
  ClubshopBanner,
  YouthBackdrop,
  YouthSection,
} from "@/components/home";
import {
  EditorialHero,
  type EditorialHeroProps,
} from "@/components/article/EditorialHero";
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

/**
 * Drop GROQ-nullable fields (`field: string | null`) so the resulting
 * shape matches the non-null `field?: string` API the EditorialHero
 * variant types expect. Generic enough to work for both transfer and
 * event projections.
 */
function nullsToUndefined<T extends object>(
  src: T | null | undefined,
): { [K in keyof T]?: NonNullable<T[K]> } | undefined {
  if (src == null) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(src)) {
    if (value !== null) out[key] = value;
  }
  return out as { [K in keyof T]?: NonNullable<T[K]> };
}

/**
 * Map an `ArticleVM` onto `<EditorialHero placement="homepage">` props.
 * Mirrors the per-variant tail the retired `toHeroCarouselArticle`
 * built for `<HomepageHeroCarousel>`: each `articleType` contributes
 * the structured data the variant renderers need (subjects, transfer
 * fact, event fact, category). The discriminated union narrowing
 * surfaces a missing branch at compile time when a new `articleType`
 * lands (e.g. matchPreview / matchRecap from #1470).
 */
function toEditorialHeroProps(article: ArticleVM): EditorialHeroProps {
  const shared = {
    placement: "homepage" as const,
    // Phase 4.5.C.1 (#1754) — the static homepage hero spans the full
    // inner width, so the canonical 2px paper-stamp press-down reads
    // as a twitch instead of a press. Use the `tilt-photo` treatment:
    // only the framed cover image tilts + scales on hover; the
    // editorial column stays still and the "★ Lees verder →" reveal
    // signals the link affordance.
    hoverStyle: "tilt-photo" as const,
    slug: article.slug,
    title: article.title,
    coverImage: article.coverImageUrl
      ? { url: article.coverImageUrl, alt: article.title }
      : undefined,
    date: article.publishedAt
      ? formatArticleDate(article.publishedAt)
      : undefined,
  };

  const variant = article.articleType ?? "announcement";
  switch (variant) {
    case "interview":
      return { ...shared, variant, subjects: article.subjects };
    case "event":
      return {
        ...shared,
        variant,
        feature: nullsToUndefined(article.firstEventFact),
      };
    case "transfer":
      return {
        ...shared,
        variant,
        feature: nullsToUndefined(article.firstTransferFact),
      };
    case "announcement":
      return { ...shared, variant, category: article.tags[0] };
    case "matchPreview":
    case "matchRecap":
      // Homepage hero stays kicker-only (VOORBESCHOUWING / MATCHVERSLAG) — no
      // `match` data, so no score bar. The score-forward bar only renders on
      // the detail page, which server-fetches the linked match (5.d-mat).
      return { ...shared, variant };
    default: {
      const _exhaustive: never = variant;
      throw new Error(
        `Unhandled articleType in toEditorialHeroProps: ${String(_exhaustive)}`,
      );
    }
  }
}

/**
 * Narrow the `ArticleVM.articleType` union (which includes `null` for
 * legacy untyped rows) down to the literal union
 * `<FeaturedUitgelichtRow>` expects. Exhaustive switch — when Sanity
 * widens the `articleType` enum (e.g. `matchPreview` / `matchRecap`
 * from #1470) the `never` assertion surfaces the missing case at
 * compile time. `<FeaturedUitgelichtRow>` already accepts those wider
 * literals, so the new branches just return the same value through.
 */
function toUitgelichtArticleType(
  type: ArticleVM["articleType"],
): UitgelichtArticleType | null {
  if (type === null || type === undefined) return null;
  switch (type) {
    case "transfer":
    case "interview":
    case "announcement":
    case "event":
    case "matchPreview":
    case "matchRecap":
      return type;
    default: {
      const _exhaustive: never = type;
      throw new Error(
        `Unhandled articleType in toUitgelichtArticleType: ${String(_exhaustive)}`,
      );
    }
  }
}

function toUitgelichtArticle(article: ArticleVM): UitgelichtArticle {
  return {
    href: `/nieuws/${article.slug}`,
    title: article.title,
    imageUrl: article.coverImageUrl ?? undefined,
    imageAlt: article.title,
    date: article.publishedAt ? formatArticleDate(article.publishedAt) : "",
    articleType: toUitgelichtArticleType(article.articleType),
    badge: article.tags[0],
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
          // Slice [0..10] per the R1.B + R2.B + R1.6 spine:
          //   • position 1 (index 0) feeds the static <EditorialHero>.
          //   • positions 2..4 (index 1..3) fill <FeaturedUitgelichtRow>.
          //   • positions 5..10 (index 4..9) fill the 3×2 <NewsGrid>.
          return all.slice(0, 10);
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

  const heroArticle = articles[0];
  const heroProps = heroArticle ? toEditorialHeroProps(heroArticle) : null;
  const uitgelichtArticles = articles.slice(1, 4).map(toUitgelichtArticle);
  const newsGridArticles = toHomepageArticles(articles.slice(4, 10));
  const upcomingMatches = mapMatchesToUpcomingMatches(matches);
  const featuredEventBandEvent = toFeaturedEventBandEvent(featuredEvent);

  if (articles.length === 0 && matches.length === 0) {
    return (
      <div className="max-w-inner-lg mx-auto px-3 py-16 text-center lg:px-0">
        <h1 className="text-jersey-deep mb-4 text-3xl font-bold lg:text-4xl">
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
  const heroSection: SectionConfig | null = heroProps
    ? {
        key: "hero",
        bg: "transparent",
        content: (
          <div className="mx-auto max-w-7xl px-4 pt-10 pb-4 md:px-8 md:pt-14 md:pb-6">
            <EditorialHero {...heroProps} />
          </div>
        ),
        paddingTop: "pt-0",
        paddingBottom: "pb-0",
      }
    : null;

  // Uitgelicht sits on `bg-cream-soft` so the warm paper backdrop carries
  // the retro-terrace-fanzine register into the featured-row band; the
  // cards' own cream bg reads as raised on the slightly darker soft-cream
  // surface. The wrapper handles its own top/bottom padding so the
  // SectionStack `pt-0 pb-0` keeps the band flush with the hero above.
  const uitgelichtSection: SectionConfig | null =
    uitgelichtArticles.length > 0
      ? {
          key: "uitgelicht",
          bg: "transparent",
          content: (
            <div className="bg-cream-soft py-12 md:py-16">
              <FeaturedUitgelichtRow articles={uitgelichtArticles} />
            </div>
          ),
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
    // R5.B `<StripedSeam>` lock — the seam is the first child of
    // `<YouthSection>` and is meant to sit AT the section's top edge,
    // butting against the previous section directly. With the default
    // `pt-20` wrapper, 80px of jersey-deep paints above the seam and
    // it reads as "sandwiched" (visible green band → seam → content).
    // `pt-0` lets the seam land flush; the section's pb-20 stays so
    // the dual-CTA row keeps its bottom breathing room.
    paddingTop: "pt-0",
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

  const clubshopSection: SectionConfig = {
    key: "clubshop",
    bg: "transparent",
    content: <ClubshopBanner />,
    paddingTop: "pt-0",
    paddingBottom: "pb-0",
  };

  return (
    <>
      {/* The static `<EditorialHero>` renders the page-level <h1> for the
          featured article when present. Only emit the sr-only "KCVV
          Elewijt" fallback when no hero is rendered (zero featured
          articles), so the document always has exactly one <h1>. */}
      {heroSection ? null : <h1 className="sr-only">KCVV Elewijt</h1>}
      <JsonLd data={buildSportsClubJsonLd()} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
        ])}
      />
      <SectionStack
        sections={[
          heroSection,
          uitgelichtSection,
          featuredEventSection,
          bannerSlotASection,
          latestNewsSection,
          upcomingMatchesSection,
          bannerSlotBSection,
          youthSection,
          bannerSlotCSection,
          sponsorsSection,
          clubshopSection,
        ]}
      />
    </>
  );
}

/**
 * Enable ISR with 1 hour revalidation
 */
export const revalidate = 3600;
