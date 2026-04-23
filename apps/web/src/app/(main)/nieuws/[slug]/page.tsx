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
import { AnnouncementTemplate } from "@/components/article/AnnouncementTemplate";
import { InterviewTemplate } from "@/components/article/InterviewTemplate";
import { TransferTemplate } from "@/components/article/TransferTemplate";
import { EventTemplate } from "@/components/article/EventTemplate";
import { ArticleViewTracker } from "@/components/article/ArticleViewTracker";
import { RelatedContentSection } from "@/components/related/RelatedContentSection/RelatedContentSection";
import type { RelatedContentItem } from "@/components/related/types";
import type { PortableTextBlock } from "@portabletext/react";
import type { IndexedSubject } from "@/components/article/SubjectAttribution";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Per-type template dispatch. Extracted out of the JSX so the nested
 * ternary (four branches, each with its own prop shape) doesn't bloat
 * the page body. Keyed on `articleType` with a default renderer for
 * missing/unknown types → `AnnouncementTemplate` (the fallback path
 * per PRD §3).
 */
interface RenderTemplateArgs {
  articleType: string | null | undefined;
  articleId: string;
  title: string;
  category?: string;
  coverImageUrl?: string;
  coverImagePortraitUrl?: string | null;
  publishedDate?: string;
  readingTime?: string;
  shareUrl: string;
  body: PortableTextBlock[] | null;
  subjects: IndexedSubject[] | null;
}

function renderTemplate(args: RenderTemplateArgs) {
  const shareConfig = { url: args.shareUrl, title: args.title };
  switch (args.articleType) {
    case "interview":
      return (
        <InterviewTemplate
          title={args.title}
          coverImageUrl={args.coverImagePortraitUrl}
          publishedDate={args.publishedDate}
          readingTime={args.readingTime}
          shareConfig={shareConfig}
          body={args.body}
          subjects={args.subjects}
          articleId={args.articleId}
          articleType={args.articleType}
        />
      );
    case "transfer":
      return (
        <TransferTemplate
          title={args.title}
          coverImageUrl={args.coverImagePortraitUrl}
          publishedDate={args.publishedDate}
          readingTime={args.readingTime}
          shareConfig={shareConfig}
          body={args.body}
          articleId={args.articleId}
          articleType={args.articleType}
        />
      );
    case "event":
      return (
        <EventTemplate
          title={args.title}
          coverImageUrl={args.coverImageUrl}
          publishedDate={args.publishedDate}
          readingTime={args.readingTime}
          shareConfig={shareConfig}
          body={args.body}
          articleId={args.articleId}
          articleType={args.articleType}
        />
      );
    // Missing or unknown articleType falls through to announcement —
    // matches the PRD §3 legacy-article fallback rule.
    default:
      return (
        <AnnouncementTemplate
          title={args.title}
          category={args.category}
          coverImageUrl={args.coverImageUrl}
          publishedDate={args.publishedDate}
          readingTime={args.readingTime}
          shareConfig={shareConfig}
          body={args.body}
          articleId={args.articleId}
          articleType={args.articleType}
        />
      );
  }
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

  const description = `${article.title} — Nieuws van KCVV Elewijt`;

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
      images: article.coverImageUrl
        ? [{ url: article.coverImageUrl, alt: article.title }]
        : [DEFAULT_OG_IMAGE],
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

  const relatedItems: RelatedContentItem[] = [
    ...articleRelatedItems,
    ...mapMentionedPlayers(article.mentionedPlayers ?? undefined),
    ...mapMentionedStaff(article.mentionedStaffMembers ?? undefined),
    ...mapMentionedTeams(article.mentionedTeams ?? undefined),
  ];

  const about = buildAboutFromSubject(article);
  const eventJsonLd = buildEventJsonLdInput(article, shareConfig.url);

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
        hasSubject={about !== undefined}
        subjectKind={
          about ? (article.subjects?.[0]?.kind ?? undefined) : undefined
        }
        subjectCount={article.subjects?.length ?? 0}
      />
      {renderTemplate({
        articleType: article.articleType,
        articleId: article.id,
        title: article.title,
        category: primaryCategory?.name,
        // Pass both projections separately — each template picks the
        // aspect it needs (Interview + Transfer take the 4:5 portrait,
        // Announcement takes the 16:9 wide). No cross-fallback: if a
        // template's preferred projection is null the template renders
        // without an image rather than cropping the wrong aspect.
        coverImageUrl: article.coverImageUrl ?? undefined,
        coverImagePortraitUrl: article.coverImagePortraitUrl ?? undefined,
        publishedDate: article.publishedAt
          ? formatArticleDate(new Date(article.publishedAt))
          : undefined,
        readingTime,
        shareUrl: shareConfig.url,
        body: (article.body as PortableTextBlock[] | null) ?? null,
        subjects: article.subjects ?? null,
      })}

      <RelatedContentSection
        items={relatedItems}
        pageType="article"
        pageSlug={article.slug}
        sourceArticleType={article.articleType}
      />
    </>
  );
}

export const revalidate = 3600;
