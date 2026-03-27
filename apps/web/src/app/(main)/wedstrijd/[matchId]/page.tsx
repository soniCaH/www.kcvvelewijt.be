/**
 * Match Detail Page
 * Displays individual match details including lineups
 */

import { Effect } from "effect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { runPromise } from "@/lib/effect/runtime";
import { BffService } from "@/lib/effect/services/BffService";
import type { MatchDetail } from "@kcvv/api-contract";
import Link from "next/link";
import { MatchDetailView } from "@/components/match/MatchDetailView";
import {
  transformHomeTeam,
  transformAwayTeam,
  transformLineupPlayer,
  extractMatchTime,
  formatMatchTitle,
  formatMatchDescription,
} from "./utils";

interface MatchPageProps {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ from?: string; fromTab?: string }>;
}

/**
 * Build SEO metadata for a match page using the route `matchId`.
 *
 * Fetches match details for the given `params.matchId` and produces a metadata
 * object containing a page `title`; when match data is available, also adds
 * `description` and `openGraph` fields populated from the match.
 *
 * @param params - Object containing the route params. `params.matchId` is the match identifier from the URL.
 * @returns Metadata with a page `title`. If match details are found, the metadata also includes `description` and `openGraph` (`title`, `description`, `type`). If the `matchId` is invalid or the match cannot be fetched, the returned metadata contains a "not found" title.
 */
export async function generateMetadata({
  params,
}: MatchPageProps): Promise<Metadata> {
  const { matchId } = await params;
  const numericId = parseInt(matchId, 10);

  if (isNaN(numericId)) {
    return {
      title: "Wedstrijd niet gevonden | KCVV Elewijt",
    };
  }

  try {
    const match = await runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getMatchDetail(numericId);
      }),
    );

    const title = formatMatchTitle(match);
    const description = formatMatchDescription(match);

    return {
      title: `${title} | KCVV Elewijt`,
      description,
      openGraph: {
        title,
        description,
        type: "website",
      },
    };
  } catch {
    return {
      title: "Wedstrijd niet gevonden | KCVV Elewijt",
    };
  }
}

/**
 * Retrieve match details for the given match ID or trigger a 404 response if unavailable.
 *
 * If the match cannot be fetched, this function calls `notFound()` to produce a 404 page.
 *
 * @returns The match detail for the specified `matchId`.
 */
async function fetchMatchOrNotFound(matchId: number): Promise<MatchDetail> {
  try {
    return await runPromise(
      Effect.gen(function* () {
        const bff = yield* BffService;
        return yield* bff.getMatchDetail(matchId);
      }),
    );
  } catch {
    notFound();
  }
}

/**
 * Render the match detail page for a given route `matchId`.
 *
 * Parses `matchId` from route params, fetches match details, transforms teams and lineup data,
 * and returns the populated match detail view. If `matchId` is invalid or the match cannot be
 * retrieved, the route responds with a 404.
 *
 * @param params - Route params object containing the string `matchId`
 * @returns The MatchDetailView populated with teams, date, time, status, competition, lineups, and report flag
 */
export default async function MatchPage({
  params,
  searchParams,
}: MatchPageProps) {
  const { matchId } = await params;
  const { from, fromTab } = await searchParams;
  const numericId = parseInt(matchId, 10);

  if (isNaN(numericId)) {
    notFound();
  }

  // Fetch match details via BffService
  const match = await fetchMatchOrNotFound(numericId);

  // Transform data for display
  const homeTeam = transformHomeTeam(match);
  const awayTeam = transformAwayTeam(match);
  const time = extractMatchTime(match);

  // Transform lineup data
  const homeLineup = match.lineup?.home.map(transformLineupPlayer) ?? [];
  const awayLineup = match.lineup?.away.map(transformLineupPlayer) ?? [];

  // Only allow back-links to internal team paths (prevent open redirect)
  const validFromTabs = ["info", "opstelling", "wedstrijden", "klassement"];
  const backUrl =
    from && /^\/ploegen\/[a-zA-Z0-9_-]+$/.test(from)
      ? `${from}${fromTab && validFromTabs.includes(fromTab) ? `?tab=${fromTab}` : ""}`
      : null;

  return (
    <>
      <MatchDetailView
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        date={match.date}
        time={time}
        status={match.status}
        competition={match.competition}
        homeLineup={homeLineup}
        awayLineup={awayLineup}
        hasReport={match.hasReport}
        backUrl={backUrl ?? undefined}
      />
      {/* Opponent history links */}
      <div className="container mx-auto max-w-3xl px-4 pb-8">
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/tegenstander/${match.home_team.id}`}
            className="text-sm text-[var(--color-muted)] underline hover:text-[var(--color-foreground)]"
          >
            Historiek vs {match.home_team.name}
          </Link>
          <Link
            href={`/tegenstander/${match.away_team.id}`}
            className="text-sm text-[var(--color-muted)] underline hover:text-[var(--color-foreground)]"
          >
            Historiek vs {match.away_team.name}
          </Link>
        </div>
      </div>
    </>
  );
}

/**
 * Enable ISR with 5 minute revalidation for match data
 * (shorter than team pages since match data changes more frequently)
 */
export const revalidate = 300;
