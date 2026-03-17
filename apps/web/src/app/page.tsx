/**
 * Homepage
 * Main landing page for KCVV Elewijt website
 */

import { Effect } from "effect";
import { DateTime } from "luxon";
import { runPromise } from "@/lib/effect/runtime";
import { SanityService } from "@/lib/effect/services/SanityService";
import type { SanityEvent } from "@/lib/effect/services/SanityService";
import { BffService } from "@/lib/effect/services/BffService";
import {
  FeaturedArticles,
  LatestNews,
  MatchWidget,
  BannerSlot,
  MatchesSliderSection,
  YouthSection,
  SponsorsSection,
} from "@/components/home";
import type { FeaturedEventStub } from "@/components/home";
import {
  mapSanityArticlesToHomepageArticles,
  mapMatchesToUpcomingMatches,
} from "@/lib/mappers";
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
 * Builds the featured event stub for the LatestNews section.
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

// TODO: load team label map from Sanity teams to avoid hardcoding team IDs
const TEAM_LABELS: Record<number, string> = {
  1235: "A-Ploeg",
};

export default async function HomePage() {
  const [articlesResult, matchesResult, eventResult, bannersResult] =
    await Promise.all([
      runPromise(
        Effect.gen(function* () {
          const sanity = yield* SanityService;
          const all = yield* sanity.getArticles();
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

  const featuredArticles = mapSanityArticlesToHomepageArticles(
    articles.slice(0, 3),
    true,
  );
  const latestNewsArticles = mapSanityArticlesToHomepageArticles(
    articles.slice(3, 9),
    false,
  );

  const upcomingMatches = mapMatchesToUpcomingMatches(matches);
  const nextMatch = upcomingMatches[0];

  const featuredEvent = eventResult
    ? buildFeaturedEventStub(eventResult)
    : undefined;

  const sliderMatches = upcomingMatches.map((m) => ({
    ...m,
    teamLabel:
      TEAM_LABELS[m.homeTeam.id as number] ??
      TEAM_LABELS[m.awayTeam.id as number] ??
      undefined,
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

  return (
    <>
      {/* Hero */}
      {featuredArticles.length > 0 && (
        <FeaturedArticles
          articles={featuredArticles}
          autoRotate={true}
          autoRotateInterval={5000}
        />
      )}

      {/* Match Widget — A-team next match */}
      {nextMatch && <MatchWidget match={nextMatch} teamLabel="A-Ploeg" />}

      {/* Banner slot A — below match widget */}
      {banners.bannerSlotA && (
        <BannerSlot
          image={banners.bannerSlotA.imageUrl}
          alt={banners.bannerSlotA.alt}
          href={banners.bannerSlotA.href ?? undefined}
        />
      )}

      {/* News + featured event */}
      {(latestNewsArticles.length > 0 || featuredEvent) && (
        <LatestNews
          articles={latestNewsArticles}
          featuredEvent={featuredEvent}
          title="Laatste nieuws"
          showViewAll
          viewAllHref="/news"
        />
      )}

      {/* Banner slot B — below news */}
      {banners.bannerSlotB && (
        <BannerSlot
          image={banners.bannerSlotB.imageUrl}
          alt={banners.bannerSlotB.alt}
          href={banners.bannerSlotB.href ?? undefined}
        />
      )}

      {/* Match slider */}
      <MatchesSliderSection matches={sliderMatches} highlightTeamId={1235} />

      {/* Youth section */}
      <YouthSection />

      {/* Banner slot C — below youth */}
      {banners.bannerSlotC && (
        <BannerSlot
          image={banners.bannerSlotC.imageUrl}
          alt={banners.bannerSlotC.alt}
          href={banners.bannerSlotC.href ?? undefined}
        />
      )}

      {/* Sponsors */}
      <SponsorsSection />
    </>
  );
}

/**
 * Enable ISR with 1 hour revalidation
 */
export const revalidate = 3600;
