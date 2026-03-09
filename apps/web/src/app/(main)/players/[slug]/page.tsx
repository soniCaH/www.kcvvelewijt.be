/**
 * Player Detail Page
 * Displays individual player profiles from Sanity (slug = psdId)
 */

import { Effect } from "effect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { runPromise } from "@/lib/effect/runtime";
import { SanityService } from "@/lib/effect/services/SanityService";
import { PlayerProfile, PlayerShare } from "@/components/player";

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
        const sanity = yield* SanityService;
        return yield* sanity.getPlayers();
      }),
    );
    return players.map((p) => ({ slug: p.psdId }));
  } catch {
    return [];
  }
}

/**
 * Build page and Open Graph metadata for a player identified by the provided slug.
 *
 * Fetches the player by its `psdId` and constructs a localized title, description,
 * and `openGraph` information including profile fields and an image when available.
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
        const sanity = yield* SanityService;
        return yield* sanity.getPlayerByPsdId(slug);
      }),
    );
    if (!player) return { title: "Speler niet gevonden | KCVV Elewijt" };

    const firstName = player.firstName ?? "";
    const lastName = player.lastName ?? "";
    const fullName = `${firstName} ${lastName}`.trim() || "Speler";
    const position = player.keeper
      ? "Keeper"
      : (player.position ?? player.positionPsd ?? "Speler");

    return {
      title: `${fullName} | KCVV Elewijt`,
      description: `${position} bij KCVV Elewijt`,
      openGraph: {
        title: fullName,
        description: `${position} bij KCVV Elewijt`,
        type: "profile",
        firstName,
        lastName,
        images: player.psdImageUrl
          ? [{ url: player.psdImageUrl, alt: fullName }]
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
      const sanity = yield* SanityService;
      return yield* sanity.getPlayerByPsdId(slug);
    }),
  );

  if (!player) notFound();

  const firstName = player.firstName ?? "";
  const lastName = player.lastName ?? "";
  const fullName = `${firstName} ${lastName}`.trim() || "Speler";
  const position = player.keeper
    ? "Keeper"
    : (player.position ?? player.positionPsd ?? "Speler");
  const number = player.jerseyNumber ?? undefined;
  const imageUrl =
    player.transparentImageUrl ?? player.psdImageUrl ?? undefined;

  return (
    <>
      <PlayerProfile
        firstName={firstName}
        lastName={lastName}
        position={position}
        number={number}
        imageUrl={imageUrl}
        teamName="KCVV Elewijt"
        birthDate={player.birthDate ?? undefined}
      />

      <section className="max-w-4xl mx-auto px-4 pb-8">
        <PlayerShare
          playerName={fullName}
          playerSlug={slug}
          teamName="KCVV Elewijt"
          showQR
        />
      </section>
    </>
  );
}

export const revalidate = 3600;
