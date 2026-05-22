/**
 * Player Detail Page — Phase 6.A composition.
 *
 * Composition (per `docs/design/mockups/phase-6-player-profile/quotesblock-locked.md`,
 * with two owner-directed deviations vs the locked spec):
 *
 *   SiteHeader (from layout)
 *   MatchStripSlot              ← top only; bottom strip dropped vs 6.d8 lock
 *   PlayerHero
 *   StripedSeam
 *   BioBlock                    ← auto-hides on empty bio
 *   QuotesBlock                 ← auto-hides on < 2 pullquote-marked spans
 *   RelatedArticlesSection
 *   FooterSafeArea
 *
 * Deviations vs the issue AC, owner-approved at branch start:
 *  - `<PlayerShare>` removed entirely (component file deleted — never
 *    designed, never reused).
 *  - `<MatchStripSlot/>` mounted inline once at the top. The 6.d8
 *    composition shows it top + bottom; the Phase 3.C lock declares the
 *    strip a landing-only chrome. Both contradict; owner picked top-only
 *    as the compromise. The Phase 3.C `(main)` layout still does NOT
 *    mount the slot — this page opts in inline because the player
 *    profile benefits from immediate next-fixture context.
 *
 * PRD §7 open questions resolved tentatively (flag at PR review):
 *  - Q3 (JSON-LD for minors) — `<Person>` JSON-LD emits for adults only.
 *  - Q5 (PlayerShare/RelatedArticles deferral) — moot for PlayerShare
 *    (deleted); RelatedArticles ships unchanged.
 */

import { Effect } from "effect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { PortableTextBlock } from "@portabletext/react";
import { runPromise } from "@/lib/effect/runtime";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { PlayerRepository } from "@/lib/repositories/player.repository";
import { ArticleRepository } from "@/lib/repositories/article.repository";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd, buildPersonJsonLd } from "@/lib/seo/jsonld";
import { BioBlock, PlayerHero, QuotesBlock } from "@/components/player";
import { RelatedArticlesSection } from "@/components/related/RelatedArticlesSection";
import { FooterSafeArea, StripedSeam } from "@/components/design-system";
import { MatchStripSlot } from "@/components/layout/MatchStrip/MatchStripSlot";
import { PageViewTracker, TrackInView } from "@/components/analytics";
import { findNthPullquoteText } from "@/lib/portable-text/findPullquoteText";

interface PlayerPageProps {
  params: Promise<{ slug: string }>;
}

const ADULT_AGE_THRESHOLD = 18;

/**
 * Conservative adult check — used to gate the Schema.org `<Person>` JSON-LD
 * emission per PRD §7 Q3. Missing or unparseable birthDate defaults to
 * `false` ("treat as minor") so privacy never relaxes on bad data; the
 * trade-off is one fewer JSON-LD record for the rare adult-with-no-DOB
 * Sanity doc.
 */
function isAdult(birthDate: string | undefined, now: Date): boolean {
  if (birthDate === undefined || birthDate === "") return false;
  const parsed = new Date(birthDate);
  if (Number.isNaN(parsed.getTime())) return false;
  const ageMs = now.getTime() - parsed.getTime();
  const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
  return ageYears >= ADULT_AGE_THRESHOLD;
}

// No static prerendering — the page body fetches PSD-synced Sanity data
// which we don't want to hammer at build time. Pages are built on-demand
// and ISR-cached (see `revalidate` at the bottom of this file).
export async function generateStaticParams() {
  return [];
}

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

  const fullName = `${player.firstName} ${player.lastName}`.trim() || "Speler";
  const personJsonLdEnabled = isAdult(player.birthDate, new Date());

  // `player.bio` is typed by Sanity codegen with a more specific span shape
  // than `@portabletext/react`'s `PortableTextBlock`. The runtime payload is
  // identical — the renderer accepts it — so a one-shot widen at this
  // boundary keeps BioBlock/QuotesBlock free of Sanity-typegen knowledge.
  const bio = player.bio as PortableTextBlock[] | undefined;

  // Pre-compute which analytics wrappers to mount. BioBlock's `bio_pullquote`
  // event represents the right-column quote card entering view (span #0 lift);
  // QuotesBlock's `quotes_block` event represents the full-width ink card
  // (span #1 lift). When the corresponding span is absent, the component
  // returns null and we skip the wrapper so the event doesn't fire on an
  // empty section.
  const hasBioPullquote =
    bio !== undefined ? findNthPullquoteText(bio, 0) !== null : false;
  const hasQuotesBlock =
    bio !== undefined ? findNthPullquoteText(bio, 1) !== null : false;
  const analyticsParams = { player_slug: slug };

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "KCVV Elewijt", url: `${SITE_CONFIG.siteUrl}/ploegen` },
          { name: fullName, url: `${SITE_CONFIG.siteUrl}/spelers/${slug}` },
        ])}
      />
      {personJsonLdEnabled ? (
        <JsonLd
          data={buildPersonJsonLd({
            name: fullName,
            url: `${SITE_CONFIG.siteUrl}/spelers/${slug}`,
            image: player.imageUrl ?? undefined,
            jobTitle: player.position ?? undefined,
          })}
        />
      ) : null}
      <PageViewTracker
        eventName="player_profile_view"
        params={analyticsParams}
      />
      <MatchStripSlot />
      <section className="mx-auto w-full max-w-[var(--container-wide)] px-4 py-12 lg:px-8 lg:py-16">
        <PlayerHero
          firstName={player.firstName}
          lastName={player.lastName}
          position={player.position}
          photoUrl={player.imageUrl}
          birthDate={player.birthDate}
          jerseyNumber={player.number}
          teamLabel={player.teamLabel}
          season={player.season}
        />
      </section>
      <StripedSeam colorPair="ink-cream" height="md" />
      {hasBioPullquote ? (
        // High threshold so the event approximates "the right-column
        // pullquote card has reached the viewport" rather than "the bio
        // section has started to enter". A more accurate observer would
        // live inside <BioBlock> targeting the `<aside>` element — punted
        // to keep BioBlock free of analytics knowledge.
        <TrackInView
          eventName="player_bio_pullquote_in_view"
          params={analyticsParams}
          threshold={0.7}
        >
          <BioBlock bio={bio} playerName={fullName} />
        </TrackInView>
      ) : (
        <BioBlock bio={bio} playerName={fullName} />
      )}
      {hasQuotesBlock ? (
        <TrackInView
          eventName="player_quotes_block_in_view"
          params={analyticsParams}
        >
          <QuotesBlock bio={bio} playerName={fullName} />
        </TrackInView>
      ) : null}
      <RelatedArticlesSection
        articles={relatedArticles}
        pageType="player"
        pageSlug={slug}
        className="mx-auto max-w-4xl px-4 pb-8"
      />
      <FooterSafeArea />
    </>
  );
}

export const revalidate = 3600;
