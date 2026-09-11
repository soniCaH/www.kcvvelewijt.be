/**
 * Dynamic Open Graph Image for Team Pages
 *
 * Youth team names *are* their age group ("U15", "U13A"), so the age group is
 * already the headline — printing it in the stamp too would say it twice. Every
 * team therefore gets the crest, and a U15 card is structurally identical to an
 * A-ploeg card. Layout, palette and typography live in `@/lib/og/share-card`.
 */

import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { degradeSection } from "@/lib/effect/degrade";
import { TeamRepository } from "@/lib/repositories/team.repository";
import {
  OG_CONTENT_TYPE,
  OG_SIZE,
  renderShareCard,
  type ShareCardProps,
} from "@/lib/og/share-card";

export const runtime = "nodejs";

export const size = OG_SIZE;

export const contentType = OG_CONTENT_TYPE;

// This route is prerendered (the parent segment exports
// `generateStaticParams`) and, like every prerendered route, defaults to
// `revalidate: false` — permanently cached — unless it declares its own
// window. A degraded club-card fallback would otherwise be baked in for the
// life of the deploy on any build-time Sanity flake, and `/api/revalidate`
// cannot rescue it: `revalidatePath` targets the sibling page route, not
// this one. Matches `page.tsx`'s own 900s window (#2433 rule 5 cap) so a
// degraded card self-heals on the same cadence as the page it illustrates
// (#2863 review round 2, finding 2).
export const revalidate = 900;

interface ImageProps {
  params: Promise<{ slug: string }>;
}

/** Club-branded card for an unknown or unfetchable team. */
const FALLBACK: ShareCardProps = { nameTop: "KCVV", nameBottom: "Elewijt" };

/**
 * Generate an Open Graph PNG for a team identified by the provided slug.
 *
 * @param params - A promise resolving to the team's slug
 * @returns A 1200×630 PNG with the club crest, team name and division
 */
export default async function Image({ params }: ImageProps) {
  const { slug } = await params;

  // An OG route has no error boundary to bubble into — a throw here serves a
  // broken image to every social crawler, so it degrades to the club card.
  // `TeamRepository.findBySlug` is a Sanity read (`E = never`, #2863), so the
  // guard must be `degradeSection` — a plain `Effect.catchAll` type-checks but
  // never runs against it.
  const card = await runPromise(
    degradeSection(
      Effect.gen(function* () {
        const repo = yield* TeamRepository;
        const team = yield* repo.findBySlug(slug);
        if (!team) return FALLBACK;
        // Same helper as the `<h1>` and the `<title>` — the share card used to
        // be the third of three names one team could go by (#2630).
        const displayName = team.displayName;
        if (displayName === "") return FALLBACK;
        const meta = team.tagline ?? team.divisionFull ?? team.division;
        return {
          nameTop: "KCVV Elewijt",
          nameBottom: displayName,
          // Falls back to the division: the card has no mono pill of its own,
          // so unlike the hero this slot is not a duplicate (#2630).
          ...(meta ? { meta } : {}),
        } satisfies ShareCardProps;
      }),
      FALLBACK,
      "[ploegen/[slug]/opengraph-image] team read failed; falling back to the club card.",
    ),
  );

  return renderShareCard(card);
}
