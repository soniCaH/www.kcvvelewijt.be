/**
 * Search Page
 * Global search across articles, players, and teams
 */

import type { Metadata } from "next";
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
  },
};

/**
 * Search page with client-side search interface
 */
export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-main via-green-hover to-green-dark-hover text-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 font-title">
            Zoeken
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl">
            Vind nieuws, spelers, teams en meer
          </p>
        </div>
      </div>

      {/* Search Interface */}
      <div className="max-w-5xl mx-auto px-4 py-12">
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
