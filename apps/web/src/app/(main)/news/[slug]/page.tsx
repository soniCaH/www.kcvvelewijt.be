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
import type { RelatedContent } from "@/components/article";
import { SanityArticleBody } from "@/components/article/SanityArticleBody/SanityArticleBody";
import type { PortableTextBlock } from "@portabletext/react";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

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

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;

  const article = await runPromise(
    Effect.gen(function* () {
      const sanity = yield* SanityService;
      return yield* sanity.getArticleBySlug(slug);
    }),
  ).catch(() => notFound());

  if (!article) notFound();

  const tags = (article.tags ?? []).map((name) => ({
    name,
    href: `/news?category=${encodeURIComponent(name)}`,
  }));

  const shareConfig = {
    url: `https://kcvvelewijt.be/news/${article.slug.current}`,
    title: article.title,
    hashtags: article.tags ?? [],
  };

  const relatedContent: RelatedContent[] = (article.relatedArticles ?? []).map(
    (related) => ({
      title: related.title,
      href: `/news/${related.slug.current}`,
      type: "article" as const,
    }),
  );

  return (
    <>
      {article.coverImageUrl ? (
        <ArticleHeader
          title={article.title}
          imageUrl={article.coverImageUrl}
          imageAlt={article.title}
        />
      ) : (
        <header className="bg-kcvv-green-bright px-3 pt-4 pb-4 xl:px-0">
          <div className="w-full max-w-inner-lg mx-auto">
            <h1 className="text-white text-[2.5rem] leading-[0.92] font-bold">
              {article.title}
            </h1>
          </div>
        </header>
      )}

      <div className="mb-6 lg:mb-10">
        <main className="w-full max-w-inner-lg mx-auto px-0 lg:flex lg:flex-row-reverse">
          <aside className="lg:flex lg:flex-col lg:w-[20rem] lg:shrink-0 lg:self-start">
            <ArticleMetadata
              author="KCVV Elewijt"
              date={
                article.publishAt
                  ? formatArticleDate(new Date(article.publishAt))
                  : ""
              }
              tags={tags}
              shareConfig={shareConfig}
            />
          </aside>

          <div className="flex-1 min-w-0">
            {Array.isArray(article.body) && article.body.length > 0 && (
              <SanityArticleBody
                content={article.body as PortableTextBlock[]}
              />
            )}
          </div>
        </main>

        {relatedContent.length > 0 && (
          <ArticleFooter relatedContent={relatedContent} />
        )}
      </div>
    </>
  );
}

export const revalidate = 3600;
