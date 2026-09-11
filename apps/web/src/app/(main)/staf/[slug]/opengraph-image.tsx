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
