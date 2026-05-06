/**
 * Help / Hulp Page
 *
 * Server-side shell renders the InteriorPageHero immediately (consistent with
 * every other route), then streams the data-dependent content inside a
 * Suspense boundary. The interactive HulpPage client component receives
 * `paths` only after `ResponsibilityRepository.findAll()` resolves.
 */

import { Suspense } from "react";
import type { Metadata } from "next";
import { Effect } from "effect";
import { DEFAULT_OG_IMAGE, SITE_CONFIG } from "@/lib/constants";
import { HulpPage } from "@/components/hulp/HulpPage";
import { InteriorPageHero } from "@/components/layout/InteriorPageHero";
import { SectionStack } from "@/components/design-system/SectionStack/SectionStack";
import { SearchInputShell } from "@/components/hulp/HulpPage/SearchInputShell";
import { QuestionCardSkeletonGrid } from "@/components/hulp/HulpPage/QuestionCardSkeleton";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildBreadcrumbJsonLd,
  buildFAQPageJsonLd,
  type FAQEntry,
} from "@/lib/seo/jsonld";
import { runPromise } from "@/lib/effect/runtime";
import { ResponsibilityRepository } from "@/lib/repositories/responsibility.repository";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const canonical = `${SITE_CONFIG.siteUrl}/hulp`;

  return {
    title: "Hulp & Contact | KCVV Elewijt",
    description:
      "Vind snel de juiste contactpersoon voor jouw vraag. Stel je vraag of blader door de categorieën.",
    keywords: [
      "hulp",
      "contact",
      "vraag",
      "verantwoordelijke",
      "wie contacteren",
      "KCVV Elewijt",
    ],
    alternates: { canonical },
    openGraph: {
      title: "Hulp & Contact - KCVV Elewijt",
      description: "Vind snel de juiste contactpersoon voor jouw vraag",
      type: "website",
      url: canonical,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

/**
 * Suspense fallback — search input shell + skeleton grid.
 * Mirrors the visual appearance of HulpPage's search + browse layout
 * so the user sees a complete shell while data loads.
 */
function HulpSkeleton() {
  return (
    <>
      <SearchInputShell />
      <QuestionCardSkeletonGrid count={4} label="Hulppagina laden..." />
    </>
  );
}

/**
 * Async server component — fetches responsibility paths and renders
 * the interactive HulpPage client component + FAQ structured data.
 * Lives inside the Suspense boundary so the hero streams immediately.
 */
async function HulpContent() {
  const paths = await runPromise(
    Effect.gen(function* () {
      const responsibilityRepo = yield* ResponsibilityRepository;
      return yield* responsibilityRepo.findAll();
    }),
  );

  const faqEntries: FAQEntry[] = paths.map((path) => {
    const stepsText = path.steps
      .map((step, i) => `${i + 1}. ${step.description}`)
      .join(" ");
    return {
      question: path.question,
      answer:
        stepsText.length > 0 ? `${path.summary} ${stepsText}` : path.summary,
    };
  });

  return (
    <>
      {faqEntries.length > 0 && (
        <JsonLd data={buildFAQPageJsonLd(faqEntries)} />
      )}
      <HulpPage paths={paths} />
    </>
  );
}

export default function HulpPageRoute() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Hulp", url: `${SITE_CONFIG.siteUrl}/hulp` },
        ])}
      />
      <SectionStack
        sections={[
          {
            key: "hero",
            bg: "kcvv-black",
            paddingTop: "pt-0",
            paddingBottom: "pb-0",
            content: (
              <InteriorPageHero
                size="compact"
                gradient="dark"
                label="Help"
                headline="Vind de juiste persoon"
                body="Stel je vraag of blader door de categorieën hieronder."
              />
            ),
            transition: {
              type: "diagonal",
              direction: "right",
              overlap: "full",
            },
          },
          {
            key: "content",
            bg: "gray-100",
            content: (
              <div className="max-w-inner-lg mx-auto space-y-12 px-4 md:px-10">
                <Suspense fallback={<HulpSkeleton />}>
                  <HulpContent />
                </Suspense>
              </div>
            ),
            transition: { type: "diagonal", direction: "left" },
          },
        ]}
      />
    </>
  );
}
