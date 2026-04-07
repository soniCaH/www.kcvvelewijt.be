/**
 * Help / Hulp Page
 *
 * Search + browse + answer view for the responsibility paths fetched
 * from Sanity. The new HulpPage UX replaces the legacy
 * "Ik ben … en ik …" inline-sentence finder.
 */

import type { Metadata } from "next";
import { Effect } from "effect";
import { DEFAULT_OG_IMAGE } from "@/lib/constants";
import { HulpPage } from "@/components/hulp/HulpPage";
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

  return <HulpPage paths={paths} />;
}

export const revalidate = 3600;
