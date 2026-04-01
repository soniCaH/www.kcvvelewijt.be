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
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { Effect } from "effect";
import { UnifiedOrganigramClient } from "@/components/organigram";
import { runPromise } from "@/lib/effect/runtime";
import { StaffRepository } from "@/lib/repositories/staff.repository";
import { ResponsibilityRepository } from "@/lib/repositories/responsibility.repository";
import { PageHero } from "@/components/design-system/PageHero";
import { Spinner } from "@/components/design-system/Spinner";

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
    images: [DEFAULT_OG_IMAGE],
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
        <PageHero
          image="/images/youth-trainers.jpg"
          imageAlt="KCVV clubstructuur"
          label="De club"
          headline="Clubstructuur & Hulp"
          body="Ontdek de structuur van KCVV Elewijt en vind snel de juiste persoon."
        />

        {/* Main Content — max-w-7xl is intentional: the D3 chart and card hierarchy need 1280px, not the 1120px of max-w-inner-lg */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Suspense
            fallback={
              <div className="flex justify-center py-12">
                <Spinner size="lg" label="Laden..." />
              </div>
            }
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
