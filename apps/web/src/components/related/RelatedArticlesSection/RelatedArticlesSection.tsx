import Link from "next/link";
import Image from "next/image";
import type { ArticleVM } from "@/lib/repositories/article.repository";

export interface RelatedArticlesSectionProps {
  articles: ArticleVM[];
  className?: string;
}

export const RelatedArticlesSection = ({
  articles,
  className,
}: RelatedArticlesSectionProps) => {
  if (articles.length === 0) return null;

  return (
    <section className={className}>
      <h3 className="text-lg font-bold mb-4">Gerelateerd</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/nieuws/${article.slug}`}
            className="group block overflow-hidden rounded-lg border border-gray-200 hover:border-kcvv-green-bright transition-colors"
          >
            {article.coverImageUrl && (
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={article.coverImageUrl}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            )}
            <div className="p-3">
              <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-kcvv-green-dark transition-colors">
                {article.title}
              </h4>
              {article.publishedAt && (
                <time
                  className="text-xs text-gray-500 mt-1 block"
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
