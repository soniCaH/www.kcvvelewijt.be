/**
 * Organigram Page
 *
 * Unified interface showing KCVV club structure with multiple views:
 * - Card Hierarchy: Collapsible card-based view
 * - Interactive Chart: D3-based visual diagram
 * - Responsibility Finder: Help system integration
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { Effect } from "effect";
import { UnifiedOrganigramClient } from "@/components/organigram";
import { clubStructure } from "@/data/club-structure";
import { runPromise } from "@/lib/effect/runtime";
import { SanityService } from "@/lib/effect/services/SanityService";
import type { ResponsibilityPath } from "@/types/responsibility";

export const metadata: Metadata = {
  title: "Organigram & Hulp | KCVV Elewijt",
  description:
    "Ontdek de organisatiestructuur van KCVV Elewijt en vind snel de juiste contactpersoon. Bekijk het organigram als kaartjes of diagram, en zoek wie je kan helpen met jouw vraag.",
  keywords: [
    "KCVV Elewijt",
    "organigram",
    "bestuur",
    "jeugdbestuur",
    "hoofdbestuur",
    "organisatie",
    "voetbalclub",
    "contactpersoon",
    "hulp",
  ],
  openGraph: {
    title: "Organigram & Hulp - KCVV Elewijt",
    description:
      "Interactieve organisatiestructuur en hulp bij KCVV Elewijt - Kies je eigen weergave en vind snel de juiste persoon",
    type: "website",
  },
};

/**
 * Renders the unified Organigram and Responsibility Finder page.
 * Responsibility paths are fetched server-side from Sanity and passed as a prop.
 *
 * @returns The React element for the organigram page.
 */
export default async function OrganigramPage() {
  const responsibilityPaths = await runPromise(
    Effect.gen(function* () {
      const sanity = yield* SanityService;
      return yield* sanity.getResponsibilityPaths();
    }),
  ).catch(() => [] as ResponsibilityPath[]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-main via-green-hover to-green-dark-hover text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1
            className="text-3xl md:text-5xl font-bold mb-4"
            style={{
              fontFamily: "quasimoda, acumin-pro, Montserrat, sans-serif",
            }}
          >
            Clubstructuur & Hulp
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl">
            Ontdek wie er bij KCVV werkt en vind snel de juiste contactpersoon
            voor jouw vraag.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Suspense fallback={<div className="text-center py-12">Laden...</div>}>
          <UnifiedOrganigramClient
            members={clubStructure}
            responsibilityPaths={responsibilityPaths as ResponsibilityPath[]}
          />
        </Suspense>
      </div>
    </div>
  );
}

export const revalidate = 3600;
