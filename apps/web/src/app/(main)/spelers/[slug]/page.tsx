/**
 * Player Detail Page
 * Displays individual player profiles from Sanity (slug = psdId)
 */

import { Effect } from "effect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { runPromise } from "@/lib/effect/runtime";
import { BffService } from "@/lib/effect/services/BffService";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { PlayerRepository } from "@/lib/repositories/player.repository";
import { ArticleRepository } from "@/lib/repositories/article.repository";
import { toOutfieldPlayerStatsData } from "@/lib/player-stats";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd, buildPersonJsonLd } from "@/lib/seo/jsonld";
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
// No static prerendering — the page body fetches PSD data via the BFF,
// which is heavily rate-limited. Pages are built on-demand and ISR-cached
// (see revalidate at the bottom of this file).
export async function generateStaticParams() {
  return [];
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
      alternates: { canonical: `${SITE_CONFIG.siteUrl}/spelers/${slug}` },
      openGraph: {
        title: fullName,
        description: `${player.position} bij KCVV Elewijt`,
        type: "profile",
        firstName: player.firstName,
        lastName: player.lastName,
        images: player.imageUrl
          ? [{ url: player.imageUrl, alt: fullName }]
          : [DEFAULT_OG_IMAGE],
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
      const repo = yield* ArticleRepository;
      return yield* repo.findRelated(player.id);
    }),
  );

  // Graceful degradation: if the BFF has no stats (404) or is unavailable
  // (502/503), show the profile without stats. Contract violations
  // (ParseError, HttpApiDecodeError) still propagate to the error boundary.
  const psdId = Number(slug);
  const playerStats = Number.isNaN(psdId)
    ? null
    : await runPromise(
        Effect.gen(function* () {
          const bff = yield* BffService;
          const stats = yield* bff.getPlayerStats(psdId);
          return toOutfieldPlayerStatsData(stats.teams);
        }).pipe(
          Effect.catchTags({
            HttpNotFound: () => Effect.succeed(null),
            HttpServiceUnavailable: () => Effect.succeed(null),
            HttpBadGateway: () => Effect.succeed(null),
          }),
        ),
      );

  const fullName = `${player.firstName} ${player.lastName}`.trim() || "Speler";
  // The BFF contract only provides outfield stats (goals, assists) — keeper-shaped
  // data (cleanSheets, goalsConceded, saves) is not yet available. Always use the
  // outfield variant until toOutfieldPlayerStatsData and the contract are position-aware.
  const statsPosition = "outfield" as const;

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "KCVV Elewijt", url: `${SITE_CONFIG.siteUrl}/ploegen` },
          { name: fullName, url: `${SITE_CONFIG.siteUrl}/spelers/${slug}` },
        ])}
      />
      <JsonLd
        data={buildPersonJsonLd({
          name: fullName,
          url: `${SITE_CONFIG.siteUrl}/spelers/${slug}`,
          image: player.imageUrl ?? undefined,
          jobTitle: player.position ?? undefined,
        })}
      />
      <PlayerProfile
        firstName={player.firstName}
        lastName={player.lastName}
        position={player.position}
        number={player.number}
        imageUrl={player.imageUrl}
        teamName="KCVV Elewijt"
        birthDate={player.birthDate}
        statsPosition={statsPosition}
        stats={playerStats ?? []}
      />

      <section className="mx-auto max-w-4xl px-4 pb-8">
        <PlayerShare
          playerName={fullName}
          playerSlug={slug}
          teamName="KCVV Elewijt"
          showQR
        />
      </section>

      <RelatedArticlesSection
        articles={relatedArticles}
        pageType="player"
        pageSlug={slug}
        className="mx-auto max-w-4xl px-4 pb-8"
      />
    </>
  );
}

export const revalidate = 3600;
