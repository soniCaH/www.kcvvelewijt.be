/**
 * Dynamic Open Graph Image for Staff Member Pages
 *
 * Staff carry no shirt number, so the crest fills the stamp and the organigram
 * position becomes the meta line. Layout, palette and typography live in
 * `@/lib/og/share-card`.
 */

import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { degradeSection } from "@/lib/effect/degrade";
import { StaffRepository } from "@/lib/repositories/staff.repository";
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
// this one. Matches `page.tsx`'s own 86400s window rather than the general
// 900s cap (`cross-page-consistency.test.ts` rule 5): `/staf/[slug]` is the
// one route #2433 deliberately left at 86400 despite degrading a Sanity
// section, and this image shares the same subject and the same webhook-
// freshness argument (#2863 review round 2, finding 2).
export const revalidate = 86400;

interface ImageProps {
  params: Promise<{ slug: string }>;
}

/** Club-branded card for an unknown or unfetchable staff member. */
const FALLBACK: ShareCardProps = { nameTop: "KCVV", nameBottom: "Elewijt" };

/**
 * Generate an Open Graph PNG for a staff member identified by the provided slug.
 *
 * @param params - A promise resolving to the member's PSD id as `slug`
 * @returns A 1200×630 PNG with the club crest, the member's name and their role
 */
export default async function Image({ params }: ImageProps) {
  const { slug } = await params;

  // An OG route has no error boundary to bubble into — a throw here serves a
  // broken image to every social crawler, so it degrades to the club card.
  // `StaffRepository.findByPsdId` is a Sanity read (`E = never`, #2863), so
  // the guard must be `degradeSection` — a plain `Effect.catchAll` type-checks
  // but never runs against it.
  const card = await runPromise(
    degradeSection(
      Effect.gen(function* () {
        const repo = yield* StaffRepository;
        const member = yield* repo.findByPsdId(slug);
        if (!member) return FALLBACK;
        const role = member.organigramPositions[0]?.title;
        return {
          nameTop: member.firstName,
          nameBottom: member.lastName,
          ...(role ? { meta: role } : {}),
        } satisfies ShareCardProps;
      }),
      FALLBACK,
      "[staf/[slug]/opengraph-image] staff-member read failed; falling back to the club card.",
    ),
  );

  return renderShareCard(card);
}
