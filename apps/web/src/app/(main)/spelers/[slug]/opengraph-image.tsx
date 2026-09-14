/**
 * Dynamic Open Graph Image for Player Pages
 *
 * The shirt number fills the stamp; players without one fall back to the crest.
 * Layout, palette and typography live in `@/lib/og/share-card`.
 */

import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { degradeSection } from "@/lib/effect/degrade";
import { PlayerRepository } from "@/lib/repositories/player.repository";
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

/** Club-branded card for an unknown or unfetchable player. */
const FALLBACK: ShareCardProps = { nameTop: "KCVV", nameBottom: "Elewijt" };

/**
 * Generate an Open Graph PNG for a player identified by the provided slug.
 *
 * @param params - A promise resolving to the player's PSD id as `slug`
 * @returns A 1200×630 PNG with the player's shirt number, name and position
 */
export default async function Image({ params }: ImageProps) {
  const { slug } = await params;

  // An OG route has no error boundary to bubble into — a throw here serves a
  // broken image to every social crawler, so it degrades to the club card.
  // `PlayerRepository.findByPsdId` is a Sanity read (`E = never`, #2863), so
  // the guard must be `degradeSection` — a plain `Effect.catchAll` type-checks
  // but never runs against it.
  const card = await runPromise(
    degradeSection(
      Effect.gen(function* () {
        const repo = yield* PlayerRepository;
        const player = yield* repo.findByPsdId(slug);
        if (!player) return FALLBACK;
        return {
          ...(player.number !== undefined
            ? { stampText: String(player.number) }
            : {}),
          nameTop: player.firstName,
          nameBottom: player.lastName,
          // Same subject as the metadata description (#2567 review): position
          // when authored, else the active team, so the card and its caption
          // never disagree about what's known.
          ...(player.metaLabel ? { meta: player.metaLabel } : {}),
        } satisfies ShareCardProps;
      }),
      FALLBACK,
      "[spelers/[slug]/opengraph-image] player read failed; falling back to the club card.",
    ),
  );

  return renderShareCard(card);
}
