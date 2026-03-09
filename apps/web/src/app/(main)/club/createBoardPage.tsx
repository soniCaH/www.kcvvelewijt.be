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
import { SanityService } from "@/lib/effect/services/SanityService";
import { BestuurPage } from "@/components/club/BestuurPage/BestuurPage";
import {
  transformSanityPlayerToRoster,
  transformSanityStaffToMember,
  getSanityTeamTagline,
} from "@/app/(main)/team/[slug]/utils";

interface BoardPageConfig {
  /** Sanity team slug (e.g. "bestuur", "jeugdbestuur") */
  slug: string;
  /** Fallback description used when the team has no tagline */
  fallbackDescription: string;
  /** Fallback page title used when Sanity is unreachable */
  fallbackTitle: string;
}

async function fetchBoardTeamOrNotFound(slug: string) {
  const team = await runPromise(
    Effect.gen(function* () {
      const sanity = yield* SanityService;
      return yield* sanity.getTeamBySlug(slug);
    }),
  ).catch(() => null);

  if (!team) notFound();
  return team;
}

export function createBoardPage({
  slug,
  fallbackDescription,
  fallbackTitle,
}: BoardPageConfig) {
  async function generateMetadata(): Promise<Metadata> {
    try {
      const team = await fetchBoardTeamOrNotFound(slug);
      const tagline = getSanityTeamTagline(team);
      const description = tagline
        ? `${team.name} — ${tagline}`
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
          tagline: getSanityTeamTagline(team),
          teamType: "club",
        }}
        players={(team.players ?? []).map(transformSanityPlayerToRoster)}
        staff={(team.staff ?? []).map(transformSanityStaffToMember)}
      />
    );
  }

  return { generateMetadata, Page };
}
