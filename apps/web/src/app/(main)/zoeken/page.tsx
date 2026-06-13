/**
 * Search Page
 *
 * Global search across articles, players, teams and staff. Phase 8 (8s1)
 * reskin: a `jersey-deep-dark` `<SearchMasthead>` band wears the search field
 * as its hero; results render on cream below. Replaces the legacy
 * green-gradient hero (master design §7 line 587). Backend (bge-m3 / Vectorize,
 * #2057) unchanged — presentation only.
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { DEFAULT_OG_IMAGE } from "@/lib/constants";
import { SearchInterface } from "@/components/search";
import { SearchMastheadSkeleton } from "@/components/search/SearchMastheadSkeleton";

export const metadata: Metadata = {
  title: "Zoeken | KCVV Elewijt",
  description:
    "Doorzoek nieuws, spelers, teams en meer op de website van KCVV Elewijt",
  keywords: ["zoeken", "search", "nieuws", "spelers", "teams", "KCVV Elewijt"],
  openGraph: {
    title: "Zoeken - KCVV Elewijt",
    description: "Doorzoek de website van KCVV Elewijt",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
};

/**
 * Search page with client-side search interface.
 *
 * `<SearchInterface>` reads `useSearchParams`, so it sits behind a `<Suspense>`
 * boundary; the fallback renders the masthead skeleton (heading + inert field)
 * so the band and `<h1>` ship in the initial HTML with no layout shift.
 */
export default function SearchPage() {
  return (
    <div className="bg-cream min-h-screen pb-[var(--footer-diagonal)]">
      <Suspense fallback={<SearchMastheadSkeleton />}>
        <SearchInterface />
      </Suspense>
    </div>
  );
}
