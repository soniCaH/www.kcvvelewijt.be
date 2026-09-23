/**
 * Article Detail Page
 * Displays individual news articles from Sanity
 */

import { cache } from "react";
import { Effect } from "effect";
import { notFound } from "next/navigation";
import type { MatchDetail } from "@kcvv/api-contract";
import { runPromise } from "@/lib/effect/runtime";
import { BffService } from "@/lib/effect/services/BffService";
import { ArticleRepository } from "@/lib/repositories/article.repository";
import { formatArticleDate } from "@/lib/utils/dates";
import { computeReadingTime } from "@/lib/utils/reading-time";
import {
  mapEditorialArticles,
  mapBffRelatedItems,
  mapMentionedPlayers,
  mapMentionedTeams,
  mapMentionedStaff,
  mapCuratedRelatedContent,
  mapRelatedToRelatedRow,
} from "@/lib/utils/article-related-items";
import { mergeRelatedRow } from "@/components/related/mergeRelatedRow";
import type { RelatedRowItem } from "@/components/related/types";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildNewsArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildEventJsonLd,
} from "@/lib/seo/jsonld";
import {
  buildAboutFromSubject,
  buildEventJsonLdInput,
} from "@/lib/seo/article-jsonld";
import {
  EditorialHero,
  type HeroMatchData,
} from "@/components/article/EditorialHero";
import { PageContainer, UpLink } from "@/components/design-system";
import { MatchGoalsBlock } from "@/components/article/blocks/MatchGoalsBlock";
import { parsePsdMatchId, toHeroMatchData } from "./utils";
// Cross-route import: the match fold-in card (#2443/#2581) needs the same
// title formatting `/wedstrijd/[matchId]` uses for its own hero — no reason
// to hand-roll a second copy (review round 1, #2788).
import { formatMatchTitle } from "@/app/(main)/wedstrijd/[matchId]/utils";
import { ArticleMetadata } from "@/components/article/ArticleMetadata";
import { ArticleBodyMotion } from "@/components/article/ArticleBodyMotion";
import {
  ArticleBody,
  qaBlocksToTailSection,
} from "@/components/article/ArticleBody";
import { QaBlock } from "@/components/article/blocks/QaBlock";
import { EditorialHeading } from "@/components/design-system/EditorialHeading";
import { ArticleCredits } from "@/components/article/ArticleCredits";
import { RelatedRow } from "@/components/related/RelatedRow";
import {
  EventDetailBlock,
  deriveIsPast,
} from "@/components/article/blocks/EventDetailBlock";
import { ArticleViewTracker } from "@/components/article/ArticleViewTracker";
import type { RelatedContentItem } from "@/components/related/types";
import type { PortableTextBlock } from "@portabletext/react";
import { resolveSubject } from "@/components/article/SubjectAttribution";
import type { ArticleDetailVM } from "@/lib/repositories/article.repository";
import type { TransferFactValue } from "@/components/article/blocks/TransferFact";
import type { EventFactValue } from "@/components/article/blocks/EventFact";
import { toPortableTextBlocks } from "@/lib/sanity/portable-text-bridge";
import { matchRowKind } from "@/lib/utils/match-display";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Phase 5.C composition helpers. The page is composed as:
 *
 *   <EditorialHero variant={articleType} placement="detail" />
 *   <ArticleMetadata />                       ← share + reading-time
 *   <SanityArticleBody body />                ← legacy renderer; #1829 tracks migration
 *   <EventDetailBlock isPast />               ← event variant only, when skip-condition passes
 *   <ArticleCredits />                        ← interview always; others when author/photographer
 *   <RelatedRow items />                      ← slider of merged, mixed-type related content (#2443/#2581)
 *
 * The single `switch (article.articleType)` lives in `renderArticleHero`
 * so the data shape of `<EditorialHero>`'s per-variant prop unions stays
 * inside one function. Variant-specific post-body blocks
 * (EventDetailBlock for events; MatchGoalsBlock for the match variants)
 * live as straight conditional renders in the page body. The former
 * standalone "Bekijk de wedstrijd" CTA band (#2443 resolution) is retired —
 * on a match article it now folds into `<RelatedRow>` as one domain-tier
 * card instead of a separate section.
 */
interface RenderArticleHeroArgs {
  article: ArticleDetailVM;
  title: string;
  primaryCategory?: string;
  publishedDate?: string;
  firstTransferFact?: TransferFactValue | null;
  firstEventFact?: EventFactValue | null;
  /** PSD match facts for the score-forward match hero (null → graceful). */
  heroMatch?: HeroMatchData | null;
}

function renderArticleHero({
  article,
  title,
  primaryCategory,
  publishedDate,
  firstTransferFact,
  firstEventFact,
  heroMatch,
}: RenderArticleHeroArgs) {
  // EditorialHero accepts string OR PortableTextBlock[] — prefer the
  // rich shape so editor-marked `accent` spans render italic +
  // jersey-deep on the H1. The Sanity typegen's PT shape is
  // structurally narrower than @portabletext/react's `PortableTextBlock`
  // (optional `children` + `markDefs: null`); `toPortableTextBlocks`
  // bridges the two at the consumption boundary so the library type
  // is satisfied without a wholesale typegen rewrite (#1830).
  const titleRich = toPortableTextBlocks(article.titleRich);
  const titleProp = titleRich.length > 0 ? titleRich : title;
  const lead = article.lead?.trim() || undefined;
  const author = article.author?.trim() || undefined;
  // Every variant uses the full 16:9 landscape cover (the aspect the
  // `coverImage` schema mandates). The old interview/transfer 4:5 portrait
  // crop center-zoomed wide group shots down to ~2 subjects. Empty URLs
  // become `undefined` so the hero skips the figure rather than rendering a
  // broken image.
  const landscape = article.coverImageUrl?.trim() || undefined;
  const landscapeCover = landscape ? { url: landscape } : undefined;

  switch (article.articleType) {
    case "interview":
      return (
        <EditorialHero
          variant="interview"
          placement="detail"
          title={titleProp}
          lead={lead}
          author={author}
          date={publishedDate}
          subjects={article.subjects ?? null}
          coverImage={landscapeCover}
        />
      );
    case "transfer":
      return (
        <EditorialHero
          variant="transfer"
          placement="detail"
          title={titleProp}
          lead={lead}
          author={author}
          date={publishedDate}
          feature={firstTransferFact ?? null}
          coverImage={landscapeCover}
        />
      );
    case "event":
      return (
        <EditorialHero
          variant="event"
          placement="detail"
          title={titleProp}
          lead={lead}
          author={author}
          date={publishedDate}
          feature={firstEventFact ?? null}
          coverImage={landscapeCover}
        />
      );
    case "matchPreview":
    case "matchRecap":
      // Score-forward H3 hero — the cover gains a crest·score·crest bar from
      // `heroMatch` (server-fetched via `article.linkedMatch`). Null heroMatch
      // (404 / unreachable) degrades to the kicker-only shell.
      return (
        <EditorialHero
          variant={article.articleType}
          placement="detail"
          title={titleProp}
          lead={lead}
          author={author}
          date={publishedDate}
          coverImage={landscapeCover}
          match={heroMatch}
        />
      );
    default:
      // Missing or unknown articleType falls through to announcement —
      // matches the PRD §3 legacy-article fallback rule.
      return (
        <EditorialHero
          variant="announcement"
          placement="detail"
          title={titleProp}
          lead={lead}
          author={author}
          date={publishedDate}
          category={primaryCategory}
          coverImage={landscapeCover}
        />
      );
  }
}

/**
 * Find the first transferFact / eventFact block in the article body.
 * `ArticleVM` (homepage projection) carries these as top-level fields,
 * but `ArticleDetailVM` (slug projection) inlines them in `body[]` — we
 * scan once at the page level rather than touching the GROQ projection.
 */
function findFirstBlock<T>(
  body: PortableTextBlock[] | null,
  type: string,
): T | null {
  if (!body) return null;
  const match = body.find((b) => (b as { _type?: string })._type === type);
  return (match as T | undefined) ?? null;
}

function shouldRenderArticleCredits(article: ArticleDetailVM): boolean {
  if (article.articleType === "interview") return true;
  const hasAuthor = !!article.author?.trim();
  const hasPhotographer = !!article.photographer?.trim();
  return hasAuthor || hasPhotographer;
}

// Deliberately empty (#3135, flake class H): an enumerated slug is rendered at
// build, so its own subject read runs against live Sanity and one 503 there
// killed the whole build. Each slug renders on its first request instead and
// ISR caches it; a failed first request is a 500 that is never cached.
// Required all the same: without this export `revalidate` is inert (#2391).
export async function generateStaticParams() {
  return [];
}

/**
 * Produce page and Open Graph metadata for the article identified by the route params.
 *
 * @param params - Route parameters (resolve to obtain the article slug) used to locate the article
 * @returns A metadata object with `title`, `description`, and an `openGraph` object containing `title`, `description`, `type`, optional `publishedTime`, `authors`, and `images`. If the article cannot be found, returns a title indicating the article was not found.
 */
// Subject read: the article is this page's entire content, so a failed
// read takes it down with it via `Effect.orDie` (#2864). Wrapped in React
// `cache()` so the same-segment `layout.tsx` (existence check, #2968),
// `generateMetadata` below, and the page component share one read per
// request instead of three (#2441).
export const fetchArticleOrNull = cache(async function fetchArticleOrNull(
  slug: string,
) {
  return runPromise(
    Effect.gen(function* () {
      const repo = yield* ArticleRepository;
      return yield* repo.findBySlug(slug);
    }).pipe(Effect.orDie),
  );
});

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  // Subject read: this route's metadata is entirely about this one article,
  // so a failed read takes it down with it — `null` (genuinely no such
  // article) is the only case that degrades to the "niet gevonden" fallback
  // (#2864).
  const article = await fetchArticleOrNull(slug);
  if (!article)
    return {
      title: "Artikel niet gevonden",
      // #2963/#2968: belt-and-braces. The same-segment `layout.tsx` now
      // gets a real 404 here, but this noindex stays in case a future
      // `loading.tsx`/ancestor boundary ever reintroduces the soft 200.
      robots: { index: false, follow: false },
    };

  const description =
    article.metaDescription?.trim() ||
    `${article.title} — Nieuws van KCVV Elewijt`;
  const ogImage = article.ogImageUrl
    ? { url: article.ogImageUrl, alt: article.title }
    : article.coverImageUrl
      ? { url: article.coverImageUrl, alt: article.title }
      : DEFAULT_OG_IMAGE;

  return {
    title: article.title,
    description,
    alternates: { canonical: `${SITE_CONFIG.siteUrl}/nieuws/${slug}` },
    openGraph: {
      title: article.title,
      description,
      type: "article" as const,
      publishedTime: article.publishedAt ?? undefined,
      authors: ["KCVV Elewijt"],
      images: [ogImage],
    },
  };
}

/**
 * Render the article detail page for the provided route slug.
 *
 * Fetches the article by slug and renders hero header, metadata bar, body, and related content.
 * Single-column layout with no sidebar.
 *
 * @param params - Route parameters object whose `slug` resolves to the article's slug string
 * @returns A JSX element representing the complete article page (or causes a 404 when the article is missing)
 */
export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;

  // Subject read: the article is this page's entire content, so a failed
  // read takes it down with it — `null` (genuinely no such article) is the
  // only case that resolves to `notFound()` (#2864). The same-segment
  // `layout.tsx` already ran this exact check before the shell flushed
  // (#2968); `cache()` means this call reuses that read.
  const article = await fetchArticleOrNull(slug);

  if (!article) notFound();

  const tags = article.tags;
  const primaryCategory = tags[0]
    ? {
        name: tags[0],
        href: `/nieuws?categorie=${encodeURIComponent(tags[0])}`,
      }
    : undefined;

  const shareConfig = {
    url: `${SITE_CONFIG.siteUrl}/nieuws/${article.slug}`,
  };

  const readingTime = computeReadingTime(article.body ?? null);
  const body = (article.body as PortableTextBlock[] | null) ?? null;
  const firstTransferFact = findFirstBlock<TransferFactValue>(
    body,
    "transferFact",
  );
  const firstEventFact = findFirstBlock<EventFactValue>(body, "eventFact");
  const publishedDate = article.publishedAt
    ? formatArticleDate(new Date(article.publishedAt))
    : undefined;

  // matchPreview / matchRecap server-fetch the linked PSD match (5.d-mat).
  // The match id is a plain string copied from /wedstrijd/[matchId], so
  // `parsePsdMatchId` gates it to a positive safe integer. Match chrome
  // (score bar + Doelpunten) is enhancement — any BFF failure (404, outage,
  // parse) degrades to no chrome rather than 404'ing or crashing the article.
  const isMatchArticle =
    article.articleType === "matchPreview" ||
    article.articleType === "matchRecap";
  const matchId = isMatchArticle ? parsePsdMatchId(article.linkedMatch) : null;
  const hasEditorialArticles =
    article.relatedArticles && article.relatedArticles.length > 0;

  // The linked match and the related-items block are independent of each
  // other, so they run as one wave rather than two serialized round-trips
  // (#2441).
  const [matchDetail, semanticItems] = await Promise.all([
    matchId !== null
      ? runPromise(
          Effect.gen(function* () {
            const bff = yield* BffService;
            return yield* bff.getMatchDetail(matchId);
          }).pipe(
            Effect.catchAll(() => Effect.succeed<MatchDetail | null>(null)),
          ),
        )
      : null,
    // Semantic (AI/vector-scored) tier — skipped entirely when the editor
    // already curated `relatedArticles` (the legacy field, now folded into
    // the curated tier below): querying the BFF for a suggestion nobody will
    // see is wasted rate-limited quota.
    hasEditorialArticles
      ? []
      : runPromise(
          Effect.gen(function* () {
            const bff = yield* BffService;
            return yield* bff.getRelated(article.id);
          }).pipe(
            Effect.map(mapBffRelatedItems),
            // Broad catch is intentional: this route uses generateStaticParams,
            // so the BFF is called at build time for every article. Build
            // workers (local dev, CI, Vercel) may not reach the Worker, and
            // rendering must still succeed without a related-items block.
            // Related content is editorial polish, not load-bearing — falling
            // back to [] is preferable to failing the article page render.
            Effect.catchAll(() => Effect.succeed<RelatedContentItem[]>([])),
          ),
        ),
  ]);
  const heroMatch = matchDetail ? toHeroMatchData(matchDetail) : null;

  // Domain tier (#2443 rule 4): the match this article previews/recaps is
  // bounded (one destination) and defining (it's THE match the article is
  // about) — but a match is not a Sanity document (see `RelatedContentItem`'s
  // docblock), so the card is built directly rather than through that union.
  // Reuses `matchDetail`, already fetched above for the hero — folding this
  // in costs no extra BFF hop, unlike a gallery linking a match would.
  const domainItems: RelatedRowItem[] = [];
  if (isMatchArticle && matchDetail && article.linkedMatch) {
    // The card's own name, not a call-to-action literal (apps/web/CLAUDE.md's
    // render-time Writer Rule — review round 1, #2788): every other card in
    // the row carries the destination's own name, so this one does too.
    // The artefact follows the KCVV side of the fixture (falling back to the
    // home team when the side can't be resolved) — it previously always
    // showed `home_team`, which is the OPPONENT's crest on an away fixture.
    const kcvvClub =
      heroMatch?.kcvvSide === "away"
        ? matchDetail.away_team
        : matchDetail.home_team;
    domainItems.push({
      title: formatMatchTitle(matchDetail),
      href: `/wedstrijd/${article.linkedMatch}`,
      badge: "WEDSTRIJD",
      artefact: { kind: "club", name: kcvvClub.name, logoUrl: kcvvClub.logo },
      analyticsId: article.linkedMatch,
      analyticsSource: "domain",
      analyticsType: "match",
      analyticsTargetSlug: article.linkedMatch,
    });
  }

  const curatedItems = [
    ...mapCuratedRelatedContent(article.relatedContent),
    ...mapEditorialArticles(article.relatedArticles ?? undefined),
  ];
  const referenceItems = [
    ...mapMentionedPlayers(article.mentionedPlayers ?? undefined),
    ...mapMentionedStaff(article.mentionedStaffMembers ?? undefined),
    ...mapMentionedTeams(article.mentionedTeams ?? undefined),
  ];

  const relatedRowItems = mergeRelatedRow({
    domain: domainItems,
    curated: mapRelatedToRelatedRow(curatedItems),
    reference: mapRelatedToRelatedRow(referenceItems),
    semantic: mapRelatedToRelatedRow(semanticItems),
    siblings: [],
  });

  const about = buildAboutFromSubject(article);
  const eventJsonLd = buildEventJsonLdInput(article, shareConfig.url);

  // matchPreview → `mentions` an upcoming SportsEvent; matchRecap → `about`
  // a played one. Nested inline via buildNewsArticleJsonLd's `sportsEvent`
  // param (reuses buildSportsEventJsonLd). The SportsEvent url is the
  // canonical match page, not the article.
  //
  // No SportsEvent for a pitch-reservation placeholder or a tournament
  // fixture with no result yet (#2606/#2696/#2802 review, mirroring
  // `/wedstrijd/[matchId]`'s own gate) — a self-match is a pitch booking,
  // not a sporting event between two competitors, and an unconfirmed
  // tournament opponent is the same unconfirmed claim, so publishing either
  // here asserted a settled head-to-head to search engines that neither the
  // article hero (`toHeroMatchData`, gated the same way) nor the match page
  // itself makes.
  const matchIsReduced =
    matchDetail !== null && matchRowKind(matchDetail) !== "match";
  const matchSportsEvent =
    matchDetail && !matchIsReduced && article.linkedMatch
      ? {
          relation:
            article.articleType === "matchRecap"
              ? ("about" as const)
              : ("mentions" as const),
          data: {
            name: `${matchDetail.home_team.name} vs ${matchDetail.away_team.name}`,
            startDate: matchDetail.date.toISOString(),
            homeTeamName: matchDetail.home_team.name,
            awayTeamName: matchDetail.away_team.name,
            status: matchDetail.status,
            url: `${SITE_CONFIG.siteUrl}/wedstrijd/${article.linkedMatch}`,
            venue: matchDetail.venue,
          },
        }
      : undefined;

  // Analytics flags derive from the same resolved-subjects list the hero
  // filters on — so subjectCount/subjectKind reflect what the UI actually
  // renders, not the raw subjects[]. A broken player ref makes both the
  // hero and analytics report one fewer subject. Prevents the paired-
  // source drift called out in apps/web CLAUDE.md §72 / #1333.
  const resolvedSubjects = (article.subjects ?? []).filter(
    (s) => resolveSubject(s) !== null,
  );
  const hasSubject = about !== undefined && resolvedSubjects.length > 0;
  const subjectKind = hasSubject
    ? (resolvedSubjects[0]?.kind ?? undefined)
    : undefined;
  const subjectCount = hasSubject ? resolvedSubjects.length : 0;

  return (
    // Page-level `bg-cream` so inter-section margins between
    // <ArticleBody>, <RelatedRow>, and the footer composition resolve
    // to cream rather than the viewport's default white. Each section
    // layers its own bg-cream on top — no visible diff inside sections,
    // and the gaps no longer show as white bands.
    <div className="bg-cream">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Nieuws", url: `${SITE_CONFIG.siteUrl}/nieuws` },
          { name: article.title, url: shareConfig.url },
        ])}
      />
      {article.publishedAt && (
        <JsonLd
          data={buildNewsArticleJsonLd({
            headline: article.title,
            datePublished: article.publishedAt,
            dateModified: article.updatedAt ?? undefined,
            author: "KCVV Elewijt",
            image: article.coverImageUrl ?? undefined,
            url: shareConfig.url,
            about,
            sportsEvent: matchSportsEvent,
          })}
        />
      )}
      {eventJsonLd && <JsonLd data={buildEventJsonLd(eventJsonLd)} />}
      <ArticleViewTracker
        articleId={article.id}
        articleType={article.articleType}
        hasSubject={hasSubject}
        subjectKind={subjectKind}
        subjectCount={subjectCount}
      />
      {/* Same width + gutters as `<EditorialHeroShell width="wide">` below it,
          so the chip lands at the container's left edge above the opening
          (#2428/#2442). The top air is `<UpLink>`'s own now (#2877) — this
          container supplies none, top or bottom: the hero's own `pt-12`
          immediately below already supplies the gap beneath it, the same
          way `<TeamHero>`'s own `py-8 sm:py-12` does for
          `/ploegen/[slug]` (#2876). */}
      <PageContainer width="default">
        <UpLink href="/nieuws" label="Nieuws" />
      </PageContainer>
      {renderArticleHero({
        article,
        title: article.title,
        primaryCategory: primaryCategory?.name,
        publishedDate,
        firstTransferFact,
        firstEventFact,
        heroMatch,
      })}

      {/* Contained event-fact panel (ART-3 Variant B, #2237) — replaces the
          old full-bleed hero strip. Sits between the hero and the article
          body; the component self-skips when the eventFact has no content. */}
      {article.articleType === "event" && firstEventFact ? (
        <EventDetailBlock
          value={firstEventFact}
          isPast={deriveIsPast(firstEventFact)}
        />
      ) : null}

      <ArticleMetadata
        date={publishedDate}
        readingTime={readingTime}
        shareConfig={shareConfig}
        articleId={article.id}
        articleType={article.articleType}
      />

      {body && body.length > 0
        ? (() => {
            // Phase 5.C: hoist `groupAtTail` qaBlocks out of the in-flow
            // body before rendering through <ArticleBody>. Tail blocks
            // render after <EndMark> under an EditorialHeading-headed
            // Q&A section per `tail-qa-header-locked.md` (5.d-tail-qa-header
            // lock, supersedes the original MonoLabel header in
            // `interview-locked.md`).
            const { inFlow, tailBlocks } = qaBlocksToTailSection(body);
            const hasTail = tailBlocks.length > 0;
            // The first eventFact on an event article is hoisted into the
            // <EventDetailBlock> panel above the body (ArticleBody's
            // docstring defers this absorption to the page) — drop it from
            // the in-flow body so it doesn't also render as an inline
            // polaroid. Later eventFacts stay inline. (#2237)
            const hoistedEventKey =
              article.articleType === "event"
                ? firstEventFact?._key
                : undefined;
            const bodyInFlow = hoistedEventKey
              ? inFlow.filter((b) => b._key !== hoistedEventKey)
              : inFlow;
            return (
              // Phase 5.C cream-shell composition: <ArticleBody> ships its
              // own `bg-cream w-full` outer wrapper that's meant to bleed
              // edge-to-edge. Wrapping it in a centered `max-w-… mx-auto px-…`
              // (the legacy <SanityArticleBody> width gate) would box the
              // cream into a narrow centered band. The prose container
              // inside ArticleBody handles centering; the page just gets
              // out of the way of the cream bleed.
              <div className="mb-6 w-full lg:mb-10">
                <ArticleBodyMotion>
                  <ArticleBody
                    className="article-body"
                    content={bodyInFlow}
                    subjects={article.subjects ?? null}
                    articleSlug={article.slug}
                    articleType={article.articleType}
                  />
                  {hasTail ? (
                    // Tail section mirrors ArticleBody's shell pattern so
                    // the cream continues edge-to-edge under the Q&A
                    // group. Outer = `bg-cream w-full`, inner = prose
                    // container at `--container-prose`.
                    <section
                      data-qa-tail-section="true"
                      aria-label="Q&A"
                      className="bg-cream w-full px-4 pb-12 sm:pb-16 lg:px-0"
                    >
                      <div
                        className="mx-auto w-full"
                        style={{ maxWidth: "var(--container-prose)" }}
                      >
                        <header className="mb-8 text-center">
                          <EditorialHeading
                            level={2}
                            size="display-xl"
                            emphasis={{ text: "Q&A", highlight: true }}
                          >
                            Q&amp;A.
                          </EditorialHeading>
                        </header>
                        <div className="flex flex-col gap-12">
                          {tailBlocks.map((block) => (
                            <QaBlock
                              key={block._key}
                              value={block}
                              subjects={article.subjects ?? null}
                            />
                          ))}
                        </div>
                      </div>
                    </section>
                  ) : null}
                </ArticleBodyMotion>
              </div>
            );
          })()
        : null}

      {/* Recap-only goalscorer roll-call (auto-hides on no goals). */}
      {article.articleType === "matchRecap" && matchDetail ? (
        <MatchGoalsBlock
          homeTeamName={matchDetail.home_team.name}
          awayTeamName={matchDetail.away_team.name}
          homeTeamLogo={matchDetail.home_team.logo}
          awayTeamLogo={matchDetail.away_team.logo}
          events={matchDetail.events ?? []}
          kcvvSide={heroMatch?.kcvvSide}
        />
      ) : null}

      {/* The standalone "Bekijk de wedstrijd" CTA band (5.d-mat-refine Foot A)
          is retired (#2443 resolution) — on a match article the same
          destination now folds into <RelatedRow>'s domain tier below as one
          card among the rest, rather than a separate section. */}

      {shouldRenderArticleCredits(article) ? (
        <ArticleCredits
          author={article.author}
          photographer={article.photographer}
          subjects={article.subjects}
          publishedAt={article.publishedAt}
        />
      ) : null}

      <RelatedRow
        items={relatedRowItems}
        pageType="article"
        pageSlug={article.slug}
        sourceArticleType={article.articleType}
      />
    </div>
  );
}

// 15m ISR — article publishes invalidate on demand via /api/revalidate
// (revalidatePath '/nieuws/<slug>' + revalidateTag 'articles'), so the window
// is not what keeps the editorial content fresh.
//
// It is what bounds a failure. Two BFF-fed sections render here — the linked
// match card and the auto related row — and both degrade to nothing rather than
// throwing (#2433 rule 3/4). A degraded render *succeeds*, so it is written into
// the cache and repeated for the whole window: at 24h a one-second blip cost a
// day of missing match chrome. #2433 rule 5 caps any route carrying a BFF-fed
// section at 900s, which is the window the section reads' own freshness
// (`/ploegen/[slug]`, `<MatchStrip>`) already runs at.
//
// This overturns the #2330 cache-freshness audit, which kept 24h on the grounds
// that Sanity is webhook-fresh and the PSD chrome is post-hoc enhancement. Both
// remain true; what the audit did not weigh is that a *failed* enhancement is
// cached exactly as long as a successful one.
export const revalidate = 900;
