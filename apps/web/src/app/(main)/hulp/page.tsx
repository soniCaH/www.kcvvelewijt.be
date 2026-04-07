/**
 * Help / Hulp Page
 *
 * Search + browse + answer view for the responsibility paths fetched
 * from Sanity. The new HulpPage UX replaces the legacy
 * "Ik ben … en ik …" inline-sentence finder.
 */

import type { Metadata } from "next";
import { Effect } from "effect";
import { DEFAULT_OG_IMAGE, SITE_CONFIG } from "@/lib/constants";
import { HulpPage } from "@/components/hulp/HulpPage";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildBreadcrumbJsonLd,
  buildFAQPageJsonLd,
  type FAQEntry,
} from "@/lib/seo/jsonld";
import { runPromise } from "@/lib/effect/runtime";
import { ResponsibilityRepository } from "@/lib/repositories/responsibility.repository";

export const metadata: Metadata = {
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
  openGraph: {
    title: "Hulp & Contact - KCVV Elewijt",
    description: "Vind snel de juiste contactpersoon voor jouw vraag",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function HulpPageRoute() {
  const paths = await runPromise(
    Effect.gen(function* () {
      const responsibilityRepo = yield* ResponsibilityRepository;
      return yield* responsibilityRepo.findAll();
    }),
  );

  // Project each responsibility path to a FAQ entry — the answer is the
  // summary plus the numbered steps joined into a single paragraph so it
  // works as a Schema.org `Answer.text` payload.
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
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Hulp", url: `${SITE_CONFIG.siteUrl}/hulp` },
        ])}
      />
      {faqEntries.length > 0 && (
        <JsonLd data={buildFAQPageJsonLd(faqEntries)} />
      )}
      <HulpPage paths={paths} />
    </>
  );
}

export const revalidate = 3600;
