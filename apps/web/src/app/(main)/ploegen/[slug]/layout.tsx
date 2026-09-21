import { notFound } from "next/navigation";
import { fetchTeamOrNull } from "./team-data";

interface TeamSegmentLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

/**
 * Same-segment layout — the existence check that gets a real `404` instead
 * of a soft one (#2968). See `(main)/spelers/[slug]/layout.tsx` for the full
 * mechanism doc.
 *
 * This segment (`ploegen/[slug]/`) has no `loading.tsx` of its own — the
 * boundaries live one level down, in `(detail)/loading.tsx` and
 * `wedstrijden/loading.tsx`, both *below* this layout. `loading.js` does not
 * wrap the `layout.js` in its own segment, but it does wrap nested
 * `layout.js`/`page.js` files — so sitting here, above both children, is
 * what keeps this one check ahead of either child's boundary. Covers both
 * `/ploegen/[slug]` (`(detail)/page.tsx`) and `/ploegen/[slug]/wedstrijden`.
 */
export default async function TeamSegmentLayout({
  children,
  params,
}: TeamSegmentLayoutProps) {
  const { slug } = await params;
  const team = await fetchTeamOrNull(slug);
  if (!team) notFound();
  return children;
}
