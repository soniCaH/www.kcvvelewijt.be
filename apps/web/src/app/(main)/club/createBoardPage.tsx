/**
 * Factory for club board pages (bestuur, jeugdbestuur, angels).
 *
 * Encapsulates the Sanity fetch, metadata generation, and BestuurPage render.
 * Each page only provides its slug and fallback strings.
 */

import type { Metadata } from "next";
import type { PortableTextBlock } from "@portabletext/react";
import { SITE_CONFIG } from "@/lib/constants";
import { Effect } from "effect";
import { notFound } from "next/navigation";
import { runPromise } from "@/lib/effect/runtime";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { BestuurPage } from "@/components/club/BestuurPage/BestuurPage";
import { TeamRepository } from "@/lib/repositories/team.repository";
import { PageViewTracker } from "@/components/analytics";

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

      return buildPageMetadata({
        title: `${team.name} | KCVV Elewijt`,
        description,
        path: `/club/${slug}`,
        ogTitle: team.name,
        ogImage: team.teamImageUrl
          ? { url: team.teamImageUrl, alt: `${team.name} foto` }
          : undefined,
      });
    } catch (error) {
      const digest = (error as { digest?: string }).digest;
      if (
        error instanceof Error &&
        typeof digest === "string" &&
        digest.startsWith("NEXT_")
      ) {
        throw error;
      }
      return buildPageMetadata({
        title: `${fallbackTitle} | KCVV Elewijt`,
        description: fallbackDescription,
        path: `/club/${slug}`,
      });
    }
  }

  async function Page() {
    const team = await fetchBoardTeamOrNotFound(slug);

    return (
      <>
        <JsonLd
          data={buildBreadcrumbJsonLd([
            { name: "Home", url: SITE_CONFIG.siteUrl },
            { name: "Club", url: `${SITE_CONFIG.siteUrl}/club` },
            { name: team.name, url: `${SITE_CONFIG.siteUrl}/club/${slug}` },
          ])}
        />
        {/* `board` slug is non-PII (bestuur / jeugdbestuur / angels). */}
        <PageViewTracker eventName="board_view" params={{ board: slug }} />
        <BestuurPage
          header={{
            name: team.name,
            imageUrl: team.teamImageUrl ?? undefined,
            tagline: team.tagline,
            teamType: "club",
          }}
          body={team.body as PortableTextBlock[] | null}
          staff={team.staff}
        />
      </>
    );
  }

  return { generateMetadata, Page };
}
