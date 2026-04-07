/**
 * Organigram Page
 *
 * Unified interface showing KCVV club structure (collapsible card hierarchy
 * + interactive D3 chart + responsibility finder), wrapped in the standard
 * SectionStack layout used across the redesigned pages.
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { Effect } from "effect";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { UnifiedOrganigramClient } from "@/components/organigram";
import { runPromise } from "@/lib/effect/runtime";
import { StaffRepository } from "@/lib/repositories/staff.repository";
import { ResponsibilityRepository } from "@/lib/repositories/responsibility.repository";
import { PageHero } from "@/components/design-system/PageHero";
import { Spinner } from "@/components/design-system/Spinner";
import {
  SectionStack,
  type SectionConfig,
} from "@/components/design-system/SectionStack/SectionStack";
import { SectionCta } from "@/components/design-system/SectionCta/SectionCta";

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

  const sections: SectionConfig[] = [
    {
      key: "hero",
      bg: "kcvv-black",
      paddingTop: "pt-0",
      paddingBottom: "pb-0",
      content: (
        <PageHero
          size="compact"
          gradient="dark"
          label="De club"
          headline="Clubstructuur"
          body="Ontdek de organisatie achter KCVV Elewijt."
        />
      ),
      transition: { type: "diagonal", direction: "right", overlap: "full" },
    },
    {
      key: "chart",
      bg: "gray-100",
      // Match the previous max-w-7xl: the D3 chart and card hierarchy need
      // 1280px of breathing room, not the 1120px of max-w-inner-lg.
      content: (
        <div className="mx-auto max-w-7xl px-4 md:px-8">
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
      ),
      transition: { type: "diagonal", direction: "left" },
    },
    {
      key: "cta",
      bg: "kcvv-black",
      paddingTop: "pt-16",
      paddingBottom: "pb-16",
      content: (
        <SectionCta
          variant="dark"
          heading="Wie zoek je?"
          body="Vind de juiste contactpersoon voor jouw vraag."
          buttonLabel="Naar de helppagina"
          buttonHref="/hulp"
        />
      ),
    },
  ];

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Club", url: `${SITE_CONFIG.siteUrl}/club` },
          { name: "Organigram", url: `${SITE_CONFIG.siteUrl}/club/organigram` },
        ])}
      />
      <SectionStack sections={sections} />
    </>
  );
}

export const revalidate = 3600;
