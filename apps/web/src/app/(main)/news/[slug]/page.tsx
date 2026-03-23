/**
 * Article Detail Page
 * Displays individual news articles from Sanity
 */

import { Effect } from "effect";
import { notFound } from "next/navigation";
import { runPromise } from "@/lib/effect/runtime";
import { SanityService } from "@/lib/effect/services/SanityService";
import { formatArticleDate } from "@/lib/utils/dates";
import {
  ArticleHeader,
  ArticleMetadata,
  ArticleFooter,
} from "@/components/article";
import { SanityArticleBody } from "@/components/article/SanityArticleBody/SanityArticleBody";
import { buildRelatedContent } from "@/lib/utils/related-content";
import type { PortableTextBlock } from "@portabletext/react";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
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
        const sanity = yield* SanityService;
        return yield* sanity.getArticles();
      }),
    );
    return articles.map((a) => ({ slug: a.slug.current }));
  } catch {
    return [];
  }
}

/**
 * Produce page and Open Graph metadata for the article identified by the route params.
 *
 * @param params - Route parameters (resolve to obtain the article slug) used to locate the article
 * @returns A metadata object with `title` and, when the article exists, an `openGraph` object containing `title`, `type`, optional `publishedTime`, `authors`, and optional `images`. If the article cannot be found, returns a title indicating the article was not found.
 */
export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  try {
    const article = await runPromise(
      Effect.gen(function* () {
        const sanity = yield* SanityService;
        return yield* sanity.getArticleBySlug(slug);
      }),
    );
    if (!article) return { title: "Artikel niet gevonden | KCVV Elewijt" };

    return {
      title: `${article.title} | KCVV Elewijt`,
      openGraph: {
        title: article.title,
        type: "article" as const,
        publishedTime: article.publishAt ?? undefined,
        authors: ["KCVV Elewijt"],
        images: article.coverImageUrl
          ? [{ url: article.coverImageUrl, alt: article.title }]
          : undefined,
      },
    };
  } catch {
    return { title: "Artikel niet gevonden | KCVV Elewijt" };
  }
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
      const sanity = yield* SanityService;
      return yield* sanity.getArticleBySlug(slug);
    }),
  );

  if (!article) notFound();

  const tags = article.tags ?? [];
  const primaryCategory = tags[0]
    ? {
        name: tags[0],
        href: `/news?category=${encodeURIComponent(tags[0])}`,
      }
    : undefined;

  const shareConfig = {
    url: `https://kcvvelewijt.be/news/${article.slug.current}`,
    title: article.title,
    hashtags: tags,
  };

  const relatedContent = buildRelatedContent({
    relatedArticles: article.relatedArticles,
    mentionedPlayers: article.mentionedPlayers,
    mentionedTeams: article.mentionedTeams,
  });

  return (
    <>
      <ArticleHeader
        title={article.title}
        imageUrl={article.coverImageUrl ?? undefined}
        imageAlt={article.title}
        category={primaryCategory?.name}
        date={
          article.publishAt
            ? formatArticleDate(new Date(article.publishAt))
            : undefined
        }
        author="KCVV Elewijt"
      />

      <ArticleMetadata
        author="KCVV Elewijt"
        date={
          article.publishAt
            ? formatArticleDate(new Date(article.publishAt))
            : undefined
        }
        category={primaryCategory}
        shareConfig={shareConfig}
      />

      <div className="mb-6 lg:mb-10">
        <main className="w-full max-w-inner-lg mx-auto px-6">
          {Array.isArray(article.body) && article.body.length > 0 && (
            <SanityArticleBody content={article.body as PortableTextBlock[]} />
          )}
        </main>

        {relatedContent.length > 0 && (
          <ArticleFooter relatedContent={relatedContent} />
        )}
      </div>
    </>
  );
}

export const revalidate = 3600;
