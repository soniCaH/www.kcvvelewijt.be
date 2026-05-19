/**
 * Article Detail Page
 * Displays individual news articles from Sanity
 */

import { Effect } from "effect";
import { notFound } from "next/navigation";
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
  mergeRelatedItems,
  mapRelatedToVerderLezen,
} from "@/lib/utils/article-related-items";
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
import { EditorialHero } from "@/components/article/EditorialHero";
import { ArticleMetadata } from "@/components/article/ArticleMetadata";
import { ArticleBodyMotion } from "@/components/article/ArticleBodyMotion";
import { SanityArticleBody } from "@/components/article/SanityArticleBody/SanityArticleBody";
import { ArticleCredits } from "@/components/article/ArticleCredits";
import { VerderLezenRow } from "@/components/article/VerderLezenRow";
import {
  EventDetailBlock,
  deriveIsPast,
  shouldRenderEventDetailBlock,
} from "@/components/article/blocks/EventDetailBlock";
import { ArticleViewTracker } from "@/components/article/ArticleViewTracker";
import type { RelatedContentItem } from "@/components/related/types";
import { FooterSafeArea } from "@/components/design-system";
import type { PortableTextBlock } from "@portabletext/react";
import { resolveSubject } from "@/components/article/SubjectAttribution";
import type { ArticleDetailVM } from "@/lib/repositories/article.repository";
import type { TransferFactValue } from "@/components/article/blocks/TransferFact";
import type { EventFactValue } from "@/components/article/blocks/EventFact";

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
 *   <VerderLezenRow items />                  ← slider of related content
 *   <FooterSafeArea />
 *
 * The single `switch (article.articleType)` lives in `renderArticleHero`
 * so the data shape of `<EditorialHero>`'s per-variant prop unions stays
 * inside one function. Variant-specific post-body blocks
 * (EventDetailBlock today; later MatchRecapStats at #1799) live as
 * straight conditional renders in the page body.
 */
interface RenderArticleHeroArgs {
  article: ArticleDetailVM;
  title: string;
  primaryCategory?: string;
  publishedDate?: string;
  firstTransferFact?: TransferFactValue | null;
  firstEventFact?: EventFactValue | null;
}

function renderArticleHero({
  article,
  title,
  primaryCategory,
  publishedDate,
  firstTransferFact,
  firstEventFact,
}: RenderArticleHeroArgs) {
  // EditorialHero accepts string OR PortableTextBlock[] (accent-decorator
  // PT title). The Sanity typegen for `titleRich` produces a shape that
  // doesn't satisfy @portabletext/react's PortableTextBlock structurally;
  // threading the rich-title through is tracked at #1830.
  const titleProp = title;
  const lead = article.lead?.trim() || undefined;
  const author = article.author?.trim() || undefined;
  // Cover-image projection picks differ per variant (portrait crop for
  // interview + transfer; landscape crop for announcement + event).
  // Empty URLs become `undefined` so the hero skips the figure rather
  // than rendering a broken image.
  const portrait = article.coverImagePortraitUrl?.trim() || undefined;
  const landscape = article.coverImageUrl?.trim() || undefined;
  const portraitCover = portrait ? { url: portrait, alt: title } : undefined;
  const landscapeCover = landscape ? { url: landscape, alt: title } : undefined;

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
          coverImage={portraitCover}
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
          coverImage={portraitCover}
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

/**
 * Provides all article slugs for static pre-rendering.
 *
 * Fetches available articles from the Sanity service and returns an array of parameter objects each containing a `slug` property.
 *
 * @returns An array of `{ slug: string }` objects for static route generation; returns an empty array if articles cannot be retrieved.
 */
export async function generateStaticParams() {
  try {
    const articles = await runPromise(
      Effect.gen(function* () {
        const repo = yield* ArticleRepository;
        return yield* repo.findAll();
      }),
    );
    return articles.map((a) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}

/**
 * Produce page and Open Graph metadata for the article identified by the route params.
 *
 * @param params - Route parameters (resolve to obtain the article slug) used to locate the article
 * @returns A metadata object with `title`, `description`, and an `openGraph` object containing `title`, `description`, `type`, optional `publishedTime`, `authors`, and `images`. If the article cannot be found, returns a title indicating the article was not found.
 */
export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await runPromise(
    Effect.gen(function* () {
      const repo = yield* ArticleRepository;
      return yield* repo.findBySlug(slug);
    }),
  );
  if (!article) return { title: "Artikel niet gevonden | KCVV Elewijt" };

  const description =
    article.metaDescription?.trim() ||
    `${article.title} — Nieuws van KCVV Elewijt`;
  const ogImage = article.ogImageUrl
    ? { url: article.ogImageUrl, alt: article.title }
    : article.coverImageUrl
      ? { url: article.coverImageUrl, alt: article.title }
      : DEFAULT_OG_IMAGE;

  return {
    title: `${article.title} | KCVV Elewijt`,
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

  const article = await runPromise(
    Effect.gen(function* () {
      const repo = yield* ArticleRepository;
      return yield* repo.findBySlug(slug);
    }),
  );

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

  const hasEditorialArticles =
    article.relatedArticles && article.relatedArticles.length > 0;

  let articleRelatedItems: RelatedContentItem[];
  if (hasEditorialArticles) {
    articleRelatedItems = mapEditorialArticles(
      article.relatedArticles ?? undefined,
    );
  } else {
    articleRelatedItems = await runPromise(
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
        Effect.catchAll(() => Effect.succeed([])),
      ),
    );
  }

  const relatedItems = mergeRelatedItems({
    curated: mapCuratedRelatedContent(article.relatedContent),
    auto: [
      ...articleRelatedItems,
      ...mapMentionedPlayers(article.mentionedPlayers ?? undefined),
      ...mapMentionedStaff(article.mentionedStaffMembers ?? undefined),
      ...mapMentionedTeams(article.mentionedTeams ?? undefined),
    ],
  });

  const about = buildAboutFromSubject(article);
  const eventJsonLd = buildEventJsonLdInput(article, shareConfig.url);

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
    <>
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
      {renderArticleHero({
        article,
        title: article.title,
        primaryCategory: primaryCategory?.name,
        publishedDate,
        firstTransferFact,
        firstEventFact,
      })}

      <ArticleMetadata
        date={publishedDate}
        readingTime={readingTime}
        shareConfig={shareConfig}
        articleId={article.id}
        articleType={article.articleType}
        className="mt-10"
      />

      {body && body.length > 0 ? (
        <div className="max-w-inner-lg mx-auto mb-6 w-full px-6 lg:mb-10">
          <ArticleBodyMotion>
            <SanityArticleBody
              className="article-body"
              content={body}
              subjects={article.subjects ?? null}
              articleSlug={article.slug}
            />
          </ArticleBodyMotion>
        </div>
      ) : null}

      {article.articleType === "event" &&
      firstEventFact &&
      shouldRenderEventDetailBlock(firstEventFact) ? (
        <EventDetailBlock
          value={firstEventFact}
          isPast={deriveIsPast(firstEventFact)}
        />
      ) : null}

      {shouldRenderArticleCredits(article) ? (
        <ArticleCredits
          author={article.author}
          photographer={article.photographer}
          subjects={article.subjects}
          publishedAt={article.publishedAt}
        />
      ) : null}

      <VerderLezenRow
        items={mapRelatedToVerderLezen(relatedItems)}
        pageType="article"
        pageSlug={article.slug}
        sourceArticleType={article.articleType}
      />
      <FooterSafeArea />
    </>
  );
}

export const revalidate = 3600;
