/**
 * News Listing Page
 * Displays articles with category filters, sourced from Sanity
 */

import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { SanityService } from "@/lib/effect/services/SanityService";
import type { SanityArticle } from "@/lib/effect/services/SanityService";
import { CategoryFilters, NewsCard } from "@/components/article";
import { PageTitle } from "@/components/layout";
import { formatArticleDate } from "@/lib/utils/dates";
import type { Metadata } from "next";
import Link from "next/link";

interface NewsPageProps {
  searchParams: Promise<{ category?: string; page?: string }>;
}

/**
 * Generate page metadata for the news archive based on the optional `category` search parameter.
 *
 * @param searchParams - Promise resolving to an object of search parameters; may include `category` to customize the title and description
 * @returns Metadata with `title` and `description`. If `category` is present both values include the category; otherwise they use the default news archive text.
 */
export async function generateMetadata({
  searchParams,
}: NewsPageProps): Promise<Metadata> {
  const { category } = await searchParams;
  if (!category) {
    return {
      title: "Nieuwsarchief | KCVV Elewijt",
      description:
        "Bekijk al het nieuws van KCVV Elewijt. Filter op categorie of zoek naar specifieke artikelen.",
    };
  }
  return {
    title: `${category} - Nieuwsarchief | KCVV Elewijt`,
    description: `Bekijk al het ${category} nieuws van KCVV Elewijt.`,
  };
}

const PAGE_SIZE = 9;

/**
 * Renders the news listing page with category filters, article cards, and pagination.
 *
 * Fetches articles from Sanity, derives category options from article tags, applies an optional category filter and in-memory pagination, then renders the resulting page UI.
 *
 * @param searchParams - A promise resolving to query parameters; supports `category` (active category slug) and `page` (1-based page number). If `page` is missing or invalid, it defaults to 1.
 * @returns The page's JSX containing the page title, category filters, article grid, and previous/next pagination controls.
 */
export default async function NewsPage({ searchParams }: NewsPageProps) {
  const params = await searchParams;
  const categorySlug = params.category;
  const parsedPage = params.page ? parseInt(params.page, 10) : 1;
  const page = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  const allArticles = await runPromise(
    Effect.gen(function* () {
      const sanity = yield* SanityService;
      return yield* sanity.getArticles();
    }).pipe(Effect.catchAll(() => Effect.succeed([] as SanityArticle[]))),
  );

  // Collect unique tags across all articles for the category filter
  const allTags = Array.from(
    new Set(allArticles.flatMap((a) => a.tags ?? [])),
  ).sort();

  // Filter by active category tag
  const filtered = categorySlug
    ? allArticles.filter((a) => a.tags?.includes(categorySlug))
    : allArticles;

  // In-memory pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const articles = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pageTitle = categorySlug
    ? `${categorySlug} - Nieuwsarchief KCVV Elewijt`
    : "Nieuwsarchief KCVV Elewijt";

  const categories = allTags.map((tag) => ({
    id: tag,
    attributes: { name: tag, slug: tag },
  }));

  return (
    <>
      <PageTitle title={pageTitle} />

      <div className="w-full max-w-inner-lg mx-auto px-3 lg:px-0 py-6">
        {/* Category filters */}
        <section className="mb-6 uppercase">
          <h5 className="mb-2">Filter op categorie</h5>
          <CategoryFilters
            categories={categories}
            activeCategory={categorySlug}
          />
        </section>

        {/* Articles grid */}
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {articles.map((article) => (
            <NewsCard
              key={article._id}
              variant="listing"
              title={article.title}
              href={`/news/${article.slug.current}`}
              imageUrl={article.coverImageUrl ?? undefined}
              imageAlt={article.title}
              badge={article.tags?.[0] ?? undefined}
              date={
                article.publishAt
                  ? formatArticleDate(new Date(article.publishAt))
                  : undefined
              }
            />
          ))}
        </main>

        {/* Pagination */}
        <footer className="border-t border-kcvv-green-100 pt-6 grid grid-cols-2 gap-4">
          <div>
            {page > 1 ? (
              <Link
                href={`/news${categorySlug ? `?category=${categorySlug}&page=${page - 1}` : `?page=${page - 1}`}`}
                className="text-kcvv-green-bright hover:underline"
              >
                &laquo; Vorige
              </Link>
            ) : (
              <span className="text-gray-400">&laquo; Vorige</span>
            )}
          </div>
          <div className="text-right">
            {page < totalPages ? (
              <Link
                href={`/news${categorySlug ? `?category=${categorySlug}&page=${page + 1}` : `?page=${page + 1}`}`}
                className="text-kcvv-green-bright hover:underline"
              >
                Volgende &raquo;
              </Link>
            ) : (
              <span className="text-gray-400">Volgende &raquo;</span>
            )}
          </div>
        </footer>
      </div>
    </>
  );
}

export const revalidate = 3600;
