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
import { SITE_CONFIG } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { Effect } from "effect";
import { UnifiedOrganigramClient } from "@/components/organigram";
import { runPromise } from "@/lib/effect/runtime";
import { StaffRepository } from "@/lib/repositories/staff.repository";
import { ResponsibilityRepository } from "@/lib/repositories/responsibility.repository";

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
 * Render the unified Organigram and Responsibility Finder page for KCVV Elewijt.
 *
 * Fetches responsibility paths from Sanity server-side and provides them, together with the club structure, to the client component that displays the organigram and responsibility finder.
 *
 * @returns The React element for the organigram page.
 */
export default async function OrganigramPage() {
  const [members, responsibilityPaths] = await runPromise(
    Effect.gen(function* () {
      const staffRepo = yield* StaffRepository;
      const responsibilityRepo = yield* ResponsibilityRepository;
      return yield* Effect.all(
        [staffRepo.findAll(), responsibilityRepo.findAll()],
        { concurrency: 2 },
      );
    }),
  );

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Club", url: `${SITE_CONFIG.siteUrl}/club` },
          { name: "Organigram", url: `${SITE_CONFIG.siteUrl}/club/organigram` },
        ])}
      />
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
          <Suspense
            fallback={<div className="text-center py-12">Laden...</div>}
          >
            <UnifiedOrganigramClient
              members={members}
              responsibilityPaths={responsibilityPaths}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}

export const revalidate = 3600;
