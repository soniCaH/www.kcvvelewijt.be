"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { trackEvent } from "@/lib/analytics/track-event";
import type { ArticleVM } from "@/lib/repositories/article.repository";
import type { RelatedPageType } from "../types";

export interface RelatedArticlesSectionProps {
  articles: ArticleVM[];
  pageType: RelatedPageType;
  pageSlug: string;
  className?: string;
}

export const RelatedArticlesSection = ({
  articles,
  pageType,
  pageSlug,
  className,
}: RelatedArticlesSectionProps) => {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current || articles.length === 0) return;
    hasFired.current = true;

    trackEvent("related_content_shown", {
      source: "reference",
      count: articles.length,
      content_types: "article",
      page_type: pageType,
      page_slug: pageSlug,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (articles.length === 0) return null;

  return (
    <section className={className}>
      <h3 className="mb-4 text-lg font-bold">Gerelateerd</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article, index) => (
          <Link
            key={article.id}
            href={`/nieuws/${article.slug}`}
            className="group hover:border-kcvv-green-bright block overflow-hidden rounded-lg border border-gray-200 transition-colors"
            onClick={() => {
              trackEvent("related_content_click", {
                source: "reference",
                target_type: "article",
                target_slug: article.slug,
                position: index + 1,
                page_type: pageType,
                page_slug: pageSlug,
              });
            }}
          >
            {article.coverImageUrl && (
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={article.coverImageUrl}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            )}
            <div className="p-3">
              <h4 className="group-hover:text-kcvv-green-dark line-clamp-2 text-sm font-semibold transition-colors">
                {article.title}
              </h4>
              {article.publishedAt && (
                <time
                  className="mt-1 block text-xs text-gray-500"
                  dateTime={article.publishedAt}
                >
                  {new Date(article.publishedAt).toLocaleDateString("nl-BE", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
