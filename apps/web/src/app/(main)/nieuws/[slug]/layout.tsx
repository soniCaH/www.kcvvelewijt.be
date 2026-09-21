import { notFound } from "next/navigation";
import { fetchArticleOrNull } from "./page";

interface ArticleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

/**
 * Same-segment layout — the existence check that gets a real `404` instead
 * of a soft one (#2968). See `(main)/spelers/[slug]/layout.tsx` for the full
 * mechanism doc — this route mirrors it exactly. No ancestor `loading.tsx`
 * sits above this segment: the list page lives at `(landing)/nieuws/`, a
 * different route-group branch.
 */
export default async function ArticleLayout({
  children,
  params,
}: ArticleLayoutProps) {
  const { slug } = await params;
  const article = await fetchArticleOrNull(slug);
  if (!article) notFound();
  return children;
}
