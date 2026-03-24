/**
 * Player Detail Page
 * Displays individual player profiles from Sanity (slug = psdId)
 */

import { Effect } from "effect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { runPromise } from "@/lib/effect/runtime";
import { PlayerRepository } from "@/lib/repositories/player.repository";
import { SanityService } from "@/lib/effect/services/SanityService";
import { PlayerProfile, PlayerShare } from "@/components/player";
import { RelatedArticlesSection } from "@/components/related/RelatedArticlesSection";

interface PlayerPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate static route parameters for all players.
 *
 * @returns An array of objects each containing a `slug` property set to the player's `psdId`; returns an empty array if player retrieval fails.
 */
export async function generateStaticParams() {
  try {
    const players = await runPromise(
      Effect.gen(function* () {
        const repo = yield* PlayerRepository;
        return yield* repo.findAll();
      }),
    );
    return players
      .filter((p): p is typeof p & { href: string } => !!p.href)
      .map((p) => ({ slug: p.href.replace("/players/", "") }));
  } catch {
    return [];
  }
}

/**
 * Build page and Open Graph metadata for a player identified by the provided slug.
 *
 * @param params - An object whose `slug` promise resolves to the player's `psdId`
 * @returns A Metadata object containing the page title, description, and `openGraph`
 *          fields for the player; if the player is not found, returns a Metadata
 *          object with the title "Speler niet gevonden | KCVV Elewijt".
 */
export async function generateMetadata({
  params,
}: PlayerPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const player = await runPromise(
      Effect.gen(function* () {
        const repo = yield* PlayerRepository;
        return yield* repo.findByPsdId(slug);
      }),
    );
    if (!player) return { title: "Speler niet gevonden | KCVV Elewijt" };

    const fullName =
      `${player.firstName} ${player.lastName}`.trim() || "Speler";

    return {
      title: `${fullName} | KCVV Elewijt`,
      description: `${player.position} bij KCVV Elewijt`,
      openGraph: {
        title: fullName,
        description: `${player.position} bij KCVV Elewijt`,
        type: "profile",
        firstName: player.firstName,
        lastName: player.lastName,
        images: player.imageUrl
          ? [{ url: player.imageUrl, alt: fullName }]
          : undefined,
      },
    };
  } catch {
    return { title: "Speler niet gevonden | KCVV Elewijt" };
  }
}

/**
 * Render the player detail page for the given route slug.
 *
 * Fetches the player by `psdId` (slug) and renders a PlayerProfile and PlayerShare section.
 * If no player is found for the provided slug, triggers a 404 via `notFound()`.
 *
 * @param params - A promise resolving to route params containing the `slug` identifying the player
 * @returns A JSX element containing the player's profile and share section
 */
export default async function PlayerPage({ params }: PlayerPageProps) {
  const { slug } = await params;

  const player = await runPromise(
    Effect.gen(function* () {
      const repo = yield* PlayerRepository;
      return yield* repo.findByPsdId(slug);
    }),
  );

  if (!player) notFound();

  const relatedArticles = await runPromise(
    Effect.gen(function* () {
      const sanity = yield* SanityService;
      return yield* sanity.getRelatedArticles(player.id);
    }),
  );

  const fullName = `${player.firstName} ${player.lastName}`.trim() || "Speler";

  return (
    <>
      <PlayerProfile
        firstName={player.firstName}
        lastName={player.lastName}
        position={player.position}
        number={player.number}
        imageUrl={player.imageUrl}
        teamName="KCVV Elewijt"
        birthDate={player.birthDate}
      />

      <section className="max-w-4xl mx-auto px-4 pb-8">
        <PlayerShare
          playerName={fullName}
          playerSlug={slug}
          teamName="KCVV Elewijt"
          showQR
        />
      </section>

      <RelatedArticlesSection
        articles={relatedArticles}
        className="max-w-4xl mx-auto px-4 pb-8"
      />
    </>
  );
}

export const revalidate = 3600;
