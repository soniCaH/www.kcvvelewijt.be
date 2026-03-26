/**
 * Help / Responsibility Finder Page
 *
 * "Ik ben ... en ik ..." question builder to find the right contact person
 */

import type { Metadata } from "next";
import { Effect } from "effect";
import { HelpPage } from "@/components/hulp/HelpPage/HelpPage";
import { runPromise } from "@/lib/effect/runtime";
import { ResponsibilityRepository } from "@/lib/repositories/responsibility.repository";

export const metadata: Metadata = {
  title: "Hulp & Contact | KCVV Elewijt",
  description:
    "Vind snel de juiste contactpersoon voor jouw vraag. Wie ben je en wat wil je weten?",
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
  },
};

export default async function HelpPageRoute() {
  const paths = await runPromise(
    Effect.gen(function* () {
      const repo = yield* ResponsibilityRepository;
      return yield* repo.findAll();
    }),
  );

  return <HelpPage paths={paths} />;
}

export const revalidate = 3600;
