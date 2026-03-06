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

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { slug } = await params;

  const player = await runPromise(
    Effect.gen(function* () {
      const sanity = yield* SanityService;
      return yield* sanity.getPlayerByPsdId(slug);
    }),
  ).catch(() => null);

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
