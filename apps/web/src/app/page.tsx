/**
 * Homepage
 * Main landing page for KCVV Elewijt website
 */

import { Effect } from "effect";
import { DateTime } from "luxon";
import { runPromise } from "@/lib/effect/runtime";
import { SanityService } from "@/lib/effect/services/SanityService";
import type { SanityEvent } from "@/lib/effect/services/SanityService";
import {
  ArticleRepository,
  toHomepageArticles,
} from "@/lib/repositories/article.repository";
import { BffService } from "@/lib/effect/services/BffService";
import {
  FeaturedArticles,
  NewsGrid,
  MatchWidget,
  BannerSlot,
  MatchesSliderSection,
  YouthSection,
  SponsorsSection,
} from "@/components/home";
import type { FeaturedEventStub } from "@/components/home";
import { SectionStack } from "@/components/design-system";
import type { SectionConfig } from "@/components/design-system";
import { mapMatchesToUpcomingMatches } from "@/lib/mappers";
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

/**
 * Builds the featured event stub for the NewsGrid section.
 * Same-day event: shows date + time range.
 * Multi-day event: shows "d MMM HH:mm – d MMM HH:mm" as single date string.
 */
function buildFeaturedEventStub(event: SanityEvent): FeaturedEventStub {
  const start = DateTime.fromISO(event.dateStart).setLocale("nl");
  const end = event.dateEnd
    ? DateTime.fromISO(event.dateEnd).setLocale("nl")
    : null;

  const now = DateTime.now();
  const diffDays = Math.ceil(start.diff(now, "days").days);
  const countdown =
    diffDays > 0
      ? `over ${diffDays} ${diffDays === 1 ? "dag" : "dagen"}`
      : undefined;

  let eventDate: string;
  let eventTime: string | undefined;

  if (end && end.startOf("day").valueOf() !== start.startOf("day").valueOf()) {
    // Multi-day: "26 apr 10:00 – 28 apr 12:00"
    eventDate = `${start.toFormat("d MMM HH:mm")} – ${end.toFormat("d MMM HH:mm")}`;
    eventTime = undefined;
  } else {
    // Same-day: date + optional time range
    eventDate = start.toFormat("d MMM");
    const startTime = start.toFormat("HH:mm");
    eventTime =
      end && end.valueOf() !== start.valueOf()
        ? `${startTime}–${end.toFormat("HH:mm")}`
        : startTime !== "00:00"
          ? startTime
          : undefined;
  }

  return {
    title: event.title,
    href: event.externalLink?.url,
    imageUrl: event.coverImageUrl ?? undefined,
    badge: "EVENEMENT",
    date: eventDate,
    time: eventTime,
    countdown,
    isExternal: !!event.externalLink?.url,
  };
}

export default async function HomePage() {
  const [articlesResult, matchesResult, eventResult, bannersResult] =
    await Promise.all([
      runPromise(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          const all = yield* repo.findAll();
          return all.slice(0, 9);
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
          const sanity = yield* SanityService;
          return yield* sanity.getNextFeaturedEvent();
        }).pipe(Effect.catchAll(() => Effect.succeed(null))),
      ),
      runPromise(
        Effect.gen(function* () {
          const sanity = yield* SanityService;
          return yield* sanity.getHomepageBanners();
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
    ]);

  const articles = articlesResult;
  const matches = matchesResult;
  const banners = bannersResult;

  const featuredArticles = toHomepageArticles(articles.slice(0, 3));
  const newsGridArticles = toHomepageArticles(articles.slice(3, 9));

  const upcomingMatches = mapMatchesToUpcomingMatches(matches);
  const nextMatch = upcomingMatches[0];

  const featuredEvent = eventResult
    ? buildFeaturedEventStub(eventResult)
    : undefined;

  const sliderMatches = upcomingMatches.map((m) => ({
    ...m,
    teamLabel: m.kcvvTeamLabel,
  }));

  if (articles.length === 0 && matches.length === 0) {
    return (
      <div className="max-w-inner-lg mx-auto px-3 lg:px-0 py-16 text-center">
        <h1 className="text-3xl lg:text-4xl font-bold text-kcvv-green-dark mb-4">
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
            href={banners.bannerSlotA.href ?? undefined}
          />
        ),
        paddingTop: "pt-0",
        paddingBottom: "pb-0",
        transition: { type: "diagonal", direction: "left" },
      }
    : null;

  const latestNewsSection: SectionConfig | null =
    newsGridArticles.length > 0 || featuredEvent
      ? {
          key: "latest-news",
          bg: "gray-100",
          content: (
            <NewsGrid
              articles={newsGridArticles}
              featuredEvent={featuredEvent}
              title="Laatste nieuws"
              showViewAll
              viewAllHref="/news"
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
            href={banners.bannerSlotB.href ?? undefined}
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
      <MatchesSliderSection matches={sliderMatches} highlightTeamId={1235} />
    ),
    transition: { type: "diagonal", direction: "right" },
  };

  const youthSection: SectionConfig = {
    key: "youth",
    bg: "kcvv-green-dark",
    content: <YouthSection />,
    paddingTop: "pt-0",
    paddingBottom: "pb-0",
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
            href={banners.bannerSlotC.href ?? undefined}
          />
        ),
        paddingTop: "pt-0",
        paddingBottom: "pb-0",
        transition: { type: "diagonal", direction: "right" },
      }
    : null;

  const sponsorsSection: SectionConfig = {
    key: "sponsors",
    bg: "kcvv-green-dark",
    content: <SponsorsSection />,
    paddingTop: "pt-8",
    paddingBottom: "pb-8",
    transition: { type: "diagonal", direction: "left" },
  };

  const preFooterSection: SectionConfig = {
    key: "pre-footer",
    bg: "gray-100",
    content: <></>,
    paddingTop: "pt-12",
    paddingBottom: "pb-12",
  };

  return (
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
        sponsorsSection,
        preFooterSection,
      ]}
    />
  );
}

/**
 * Enable ISR with 1 hour revalidation
 */
export const revalidate = 3600;
