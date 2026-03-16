/**
 * Homepage
 * Main landing page for KCVV Elewijt website
 */

import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { SanityService } from "@/lib/effect/services/SanityService";
import { BffService } from "@/lib/effect/services/BffService";
import { FeaturedArticles, LatestNews, MatchWidget } from "@/components/home";
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
 * Render the homepage with a featured articles carousel, the next match widget, and a latest-news section.
 *
 * Fetches recent articles and upcoming matches, shows the first three articles as featured items and the next six as latest news, and renders a centered fallback message if both article and match data are unavailable.
 *
 * @returns The homepage React element containing the featured articles carousel, the next match widget (if available), and the latest news section, or a centered fallback message when no content is available.
 */
export default async function HomePage() {
  // Fetch latest articles and upcoming matches in parallel with error handling
  const [articlesResult, matchesResult] = await Promise.all([
    runPromise(
      Effect.gen(function* () {
        const sanity = yield* SanityService;
        const all = yield* sanity.getArticles();
        // Return 9 most-recent articles (already sorted by publishAt desc in GROQ)
        return all.slice(0, 9);
      }).pipe(Effect.catchAll(() => Effect.succeed([]))),
    ),
    runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getNextMatches();
      }).pipe(
        // Graceful fallback: return empty array on error
        Effect.catchAll((error) => {
          console.error("[HomePage] Failed to fetch matches:", error);
          return Effect.succeed([]);
        }),
      ),
    ),
  ]);

  const articles = articlesResult;
  const matches = matchesResult;

  // Split articles: first 3 for featured carousel, remaining 6 for latest news
  const featuredArticles = mapSanityArticlesToHomepageArticles(
    articles.slice(0, 3),
    true,
  );
  const latestNewsArticles = mapSanityArticlesToHomepageArticles(
    articles.slice(3, 9),
    false,
  );

  // Map matches to component format (Weitse Gans already filtered at service level)
  const upcomingMatches = mapMatchesToUpcomingMatches(matches);
  const nextMatch = upcomingMatches[0];

  // Show fallback message if no content could be loaded at all
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
      {/* Featured Articles Hero Carousel */}
      {featuredArticles.length > 0 && (
        <FeaturedArticles
          articles={featuredArticles}
          autoRotate={true}
          autoRotateInterval={5000}
        />
      )}

      {/* Match Widget — next A-team match */}
      {nextMatch && <MatchWidget match={nextMatch} teamLabel="A-Ploeg" />}

      {/* Latest News Section */}
      {latestNewsArticles.length > 0 && (
        <LatestNews
          articles={latestNewsArticles}
          title="Laatste nieuws"
          showViewAll={true}
          viewAllHref="/news"
        />
      )}

      {/* TODO: Future enhancements:
       * - KCVVTV video section (on hold - no cameraman available)
       */}
    </>
  );
}

/**
 * Enable ISR with 1 hour revalidation
 */
export const revalidate = 3600;
