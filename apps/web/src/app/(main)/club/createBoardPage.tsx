/**
 * Factory for club board pages (bestuur, jeugdbestuur, angels).
 *
 * Encapsulates the Sanity fetch, metadata generation, and BestuurPage render.
 * Each page only provides its slug and fallback strings.
 */

import type { Metadata } from "next";
import { Effect } from "effect";
import { notFound } from "next/navigation";
import { runPromise } from "@/lib/effect/runtime";
import { BestuurPage } from "@/components/club/BestuurPage/BestuurPage";
import { type RoutablePlayerVM } from "@/lib/repositories/player.repository";
import { TeamRepository } from "@/lib/repositories/team.repository";

interface BoardPageConfig {
  /** Sanity team slug (e.g. "bestuur", "jeugdbestuur") */
  slug: string;
  /** Fallback description used when the team has no tagline */
  fallbackDescription: string;
  /** Fallback page title used when Sanity is unreachable */
  fallbackTitle: string;
}

/**
 * Fetches a team by its Sanity slug or triggers a Next.js 404 response when absent.
 *
 * If no team is found, this function calls Next.js `notFound()` to end the request with a 404.
 *
 * @param slug - The Sanity team slug (for example: "bestuur", "jeugdbestuur")
 * @returns The fetched team object from Sanity
 */
async function fetchBoardTeamOrNotFound(slug: string) {
  const team = await runPromise(
    Effect.gen(function* () {
      const repo = yield* TeamRepository;
      return yield* repo.findBySlug(slug);
    }),
  );

  if (!team) notFound();
  return team;
}

/**
 * Create a page factory for a club board that provides metadata generation and a page component.
 *
 * @param slug - Sanity team slug identifying which team to fetch (e.g., "bestuur", "jeugdbestuur")
 * @param fallbackDescription - Description used when the team has no tagline or Sanity data is unavailable
 * @param fallbackTitle - Title used when Sanity data cannot be fetched
 * @returns An object with:
 *  - `generateMetadata`: a function that builds the page Metadata (title, description, and Open Graph data) for the configured team slug
 *  - `Page`: a React component that renders the BestuurPage using the fetched Sanity team data (header, players, and staff)
 */
export function createBoardPage({
  slug,
  fallbackDescription,
  fallbackTitle,
}: BoardPageConfig) {
  async function generateMetadata(): Promise<Metadata> {
    try {
      const team = await fetchBoardTeamOrNotFound(slug);
      const description = team.tagline
        ? `${team.name} — ${team.tagline}`
        : fallbackDescription;

      return {
        title: `${team.name} | KCVV Elewijt`,
        description,
        openGraph: {
          title: team.name,
          description,
          type: "website",
          images: team.teamImageUrl
            ? [{ url: team.teamImageUrl, alt: `${team.name} foto` }]
            : undefined,
        },
      };
    } catch (error) {
      const digest = (error as { digest?: string }).digest;
      if (
        error instanceof Error &&
        typeof digest === "string" &&
        digest.startsWith("NEXT_")
      ) {
        throw error;
      }
      return {
        title: `${fallbackTitle} | KCVV Elewijt`,
        description: fallbackDescription,
      };
    }
  }

  async function Page() {
    const team = await fetchBoardTeamOrNotFound(slug);

    return (
      <BestuurPage
        header={{
          name: team.name,
          imageUrl: team.teamImageUrl ?? undefined,
          tagline: team.tagline,
          teamType: "club",
        }}
        players={team.players.filter(
          (p): p is RoutablePlayerVM => p.href !== undefined,
        )}
        staff={team.staff}
      />
    );
  }

  return { generateMetadata, Page };
}
