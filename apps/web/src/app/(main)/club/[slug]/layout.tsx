import { notFound } from "next/navigation";
import { fetchPage } from "./page";

interface ClubPageLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

/**
 * Same-segment layout — the existence check that gets a real `404` instead
 * of a soft one (#2968). See `(main)/spelers/[slug]/layout.tsx` for the full
 * mechanism doc. `club/loading.tsx` (the sibling index route's own skeleton)
 * is an *ancestor* of `club/(index)/`, not of this `club/[slug]/` segment —
 * #2791/#3037 moved every hub page into its own route group, so there is no
 * boundary above this layout to route around.
 */
export default async function ClubPageLayout({
  children,
  params,
}: ClubPageLayoutProps) {
  const { slug } = await params;
  const page = await fetchPage(slug);
  if (!page) notFound();
  return children;
}
