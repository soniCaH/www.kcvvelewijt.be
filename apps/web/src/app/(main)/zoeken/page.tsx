/**
 * Search Page
 * Global search across articles, players, and teams
 */

import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/constants";
import { Suspense } from "react";
import { SearchInterface } from "@/components/search";
import { Spinner } from "@/components/design-system";

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
 * Search page with client-side search interface
 */
export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <div className="from-green-main via-green-hover to-green-dark-hover bg-gradient-to-br px-4 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-title mb-4 text-4xl font-bold md:text-6xl">
            Zoeken
          </h1>
          <p className="max-w-3xl text-xl text-white/90 md:text-2xl">
            Vind nieuws, spelers, teams en meer
          </p>
        </div>
      </div>

      {/* Search Interface */}
      <div className="mx-auto max-w-5xl px-4 py-12">
        <Suspense
          fallback={
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          }
        >
          <SearchInterface />
        </Suspense>
      </div>
    </div>
  );
}
