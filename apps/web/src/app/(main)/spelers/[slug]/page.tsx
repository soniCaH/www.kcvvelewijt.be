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
 *   RelatedRow                  ← full-bleed "Blijf nog even hangen." slider; auto-hides on empty (#2581)
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
import { degradeSection } from "@/lib/effect/degrade";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd, buildPersonJsonLd } from "@/lib/seo/jsonld";
import { BioBlock, PlayerHero, QuotesBlock } from "@/components/player";
import { RelatedRow } from "@/components/related/RelatedRow";
import { mergeRelatedRow } from "@/components/related/mergeRelatedRow";
import type { RelatedRowItem } from "@/components/related/types";
import { articleVMsToRelatedRowItems } from "@/lib/utils/article-related-items";
import { PageContainer, StripedSeam, UpLink } from "@/components/design-system";
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
  let ageYears = now.getUTCFullYear() - parsed.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - parsed.getUTCMonth();
  if (
    monthDelta < 0 ||
    (monthDelta === 0 && now.getUTCDate() < parsed.getUTCDate())
  ) {
    ageYears -= 1;
  }
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
      }).pipe(Effect.orDie),
    );
    if (!player)
      return {
        title: "Speler niet gevonden",
        // #2963: this branch renders under a 200 (a `loading.tsx`
        // Suspense boundary flushes the shell before `notFound()` runs),
        // so noindex is what actually keeps it out of the index.
        robots: { index: false, follow: false },
      };

    const fullName =
      `${player.firstName} ${player.lastName}`.trim() || "Speler";
    // `metaLabel` (position, else team — #2567) is the same subject the OG
    // share card's `meta` line uses, so the two surfaces in one share
    // preview never disagree. The bare-name rung only fires when neither is
    // known; "bij KCVV Elewijt" still adds the club affiliation beyond the
    // title, so it's kept rather than an empty description.
    const subject = player.metaLabel || fullName;
    const description = `${subject} bij KCVV Elewijt`;

    return {
      title: fullName,
      description,
      alternates: { canonical: `${SITE_CONFIG.siteUrl}/spelers/${slug}` },
      openGraph: {
        title: fullName,
        description,
        type: "profile",
        firstName: player.firstName,
        lastName: player.lastName,
        images: player.imageUrl
          ? [{ url: player.imageUrl, alt: fullName }]
          : [DEFAULT_OG_IMAGE],
      },
    };
  } catch {
    return {
      title: "Speler niet gevonden",
      // Deliberately NOT noindex: this `catch` fires on a read failure
      // (Sanity/BFF outage, timeout, parse error), not only on an unknown
      // id. Emitting noindex here would ask Google to drop a live, indexed
      // page during an outage. Only the genuine not-found branch above
      // carries it.
    };
  }
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { slug } = await params;

  // Subject read: the player is this page's entire content, so a failed
  // read takes it down with it — `null` (genuinely no such player) is the
  // only case that resolves to `notFound()` (#2864).
  const player = await runPromise(
    Effect.gen(function* () {
      const repo = yield* PlayerRepository;
      return yield* repo.findByPsdId(slug);
    }).pipe(Effect.orDie),
  );

  if (!player) notFound();

  // "Blijf nog even hangen." is a section, not the subject (#2433 rule 3),
  // and its absence asserts nothing — the visitor was never promised a
  // read-next row — so it auto-hides rather than announcing the failure
  // (rule 4). Only one read left here: `PLAYER_BY_PSD_ID_QUERY` already
  // resolves the player's own team (`player.teamId`/`teamSlug`/
  // `teamImageUrl`) in the fetch above via the byte-identical
  // `references()` subquery `TeamRepository.findByMemberId` runs — a
  // second serial round-trip just to pick up `teamImageUrl` was redundant
  // (review round 1, #2788). `/staf/[slug]` still needs its own call: staff
  // has no equivalent projection.
  const relatedArticles = await runPromise(
    degradeSection(
      Effect.gen(function* () {
        const repo = yield* ArticleRepository;
        return yield* repo.findRelated(player.id);
      }),
      [],
      "[spelers/[slug]] related-articles lookup failed; rendering without the RelatedRow.",
    ),
  );

  // `teamLabel` can legitimately resolve to "" — `teamDisplayName` falls
  // through to the team's raw `name` when the slug carries no age/letter
  // token, and that `name` can itself be null/empty in Sanity (CodeRabbit
  // finding on PR #2788, round 2) — so the guard checks the label too,
  // not just the id/slug pair, or an empty-titled card would still link.
  const domainItems: RelatedRowItem[] =
    player.teamId && player.teamSlug && player.teamLabel
      ? [
          {
            title: player.teamLabel,
            href: `/ploegen/${player.teamSlug}`,
            imageUrl: player.teamImageUrl,
            artefact: player.teamImageUrl
              ? undefined
              : { kind: "team" as const },
            badge: "PLOEG",
            analyticsId: player.teamId,
            analyticsSource: "domain",
            analyticsType: "team",
            analyticsTargetSlug: player.teamSlug,
          },
        ]
      : [];

  const relatedRowItems = mergeRelatedRow({
    domain: domainItems,
    curated: [],
    reference: articleVMsToRelatedRowItems(relatedArticles),
    semantic: [],
    siblings: [],
  });

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
          { name: "Ploegen", url: `${SITE_CONFIG.siteUrl}/ploegen` },
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
      <PageContainer as="section" className="pb-12 lg:pb-16">
        <UpLink href="/ploegen" label="Ploegen" className="mb-6" />
        <PlayerHero
          id={player.id}
          firstName={player.firstName}
          lastName={player.lastName}
          position={player.position}
          photoUrl={player.imageUrl}
          birthDate={player.birthDate}
          jerseyNumber={player.number}
          teamLabel={player.teamLabel}
        />
      </PageContainer>
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
      {/* Full-bleed cream "Blijf nog even hangen." slider — auto-hides when
          empty (#2443/#2581). */}
      <RelatedRow items={relatedRowItems} pageType="player" pageSlug={slug} />
    </>
  );
}

// 15m ISR — player data is PSD-synced + editor-published and on-demand
// revalidation keeps it fresh via /api/revalidate (revalidateTag 'players'),
// so the window is not what keeps this page current.
//
// It is what bounds a failure. This route mounts `<MatchStripSlot>` inline, a
// BFF read that degrades to no strip, and the "Verder lezen." row above now
// degrades to nothing as well — both are then written into this page's ISR
// entry for the whole window (#2433 rule 5, cap 900s). `/api/revalidate` busts
// a profile on a `player` change only, never on an article publish, so nothing
// else shortens it.
export const revalidate = 900;
