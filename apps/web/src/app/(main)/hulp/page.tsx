/**
 * Help / Responsibility Finder Page
 *
 * "Ik ben ... en ik ..." question builder to find the right contact person
 */

import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/constants";
import { Effect } from "effect";
import { HelpPage } from "@/components/hulp/HelpPage/HelpPage";
import { runPromise } from "@/lib/effect/runtime";
import { ResponsibilityRepository } from "@/lib/repositories/responsibility.repository";
import { TeamRepository } from "@/lib/repositories/team.repository";

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
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function HelpPageRoute() {
  const { paths, youthTeams } = await runPromise(
    Effect.gen(function* () {
      const responsibilityRepo = yield* ResponsibilityRepository;
      const teamRepo = yield* TeamRepository;
      const [paths, youthTeams] = yield* Effect.all([
        responsibilityRepo.findAll(),
        teamRepo.findYouthTeamsForContact(),
      ]);
      return { paths, youthTeams };
    }),
  );

  return <HelpPage paths={paths} youthTeams={youthTeams} />;
}

export const revalidate = 3600;
