/**
 * BestuurPage — board pages (`/club/bestuur`, `/club/jeugdbestuur`,
 * `/club/angels`) on the Phase 7 redesign spine (design contract 7b1 + 7b2):
 *
 *   <PageHero register="band" tone="dark"> (group photo, warm "." accent)
 *     → <StripedSeam>
 *     → editorial description ("Over het …", team.body, jersey-deep left rule)
 *     → "De leden" — <TeamStaff> (6.C, staff-by-role)
 *     → <BoardCtaBand> → /hulp#structuur
 *
 * Replaces the legacy SectionStack + InteriorPageHero + TeamRoster + SectionCta
 * composition; boards were the last consumer of <TeamRoster>/<StaffCard>.
 */

import {
  PortableText,
  type PortableTextBlock,
  type PortableTextComponents,
} from "@portabletext/react";
import {
  PageContainer,
  SectionHeader,
  StripedSeam,
} from "@/components/design-system";
import {
  TeamStaff,
  type TeamStaffMemberData,
} from "@/components/team/TeamStaff";
import { hasRenderableBioContent } from "@/lib/portable-text/findPullquoteText";
import { PageHero } from "@/components/layout/PageHero";
import { BoardCtaBand } from "@/components/club/BoardCtaBand";

/** Lead shown when the team carries no tagline of its own. */
const BOARD_LEAD_FALLBACK = "De mensen achter KCVV Elewijt";

// Board descriptions are plain editorial prose; the `pullquote` decorator (used
// on player/team bodies) renders inline here with no special treatment.
const bodyComponents: PortableTextComponents = {
  marks: {
    pullquote: ({ children }) => <>{children}</>,
  },
};

export interface BestuurPageHeader {
  /** Team name (rendered as the hero headline). */
  name: string;
  /** Team tagline (the opening's lead — falls back to `BOARD_LEAD_FALLBACK`). */
  tagline?: string;
  /** Team / group photo URL — the hero photo. */
  imageUrl?: string;
  /** Team type — kept for prop compatibility with the route call sites. */
  teamType?: "senior" | "youth" | "club";
}

export interface BestuurPageProps {
  /** Team header data. */
  header: BestuurPageHeader;
  /** `team.body` Portable Text — the editorial description ("Over het …"). */
  body?: PortableTextBlock[] | null;
  /** Board members (staff-by-role). Players are not rendered on boards. */
  staff?: readonly TeamStaffMemberData[];
}

export function BestuurPage({ header, body, staff = [] }: BestuurPageProps) {
  const showDescription =
    Array.isArray(body) && body.length > 0 && hasRenderableBioContent(body);
  const hasMembers = staff.length > 0;

  return (
    <>
      {/* No kicker: the up-link inside the band already names the parent
          ("‹ De club"), so a "De club" kicker on the same line would say it
          twice (#2442 rule 6, applied here — not one of the two routes the
          rule originally named, but the same duplication). */}
      <PageHero
        register="band"
        tone="dark"
        headline={header.name}
        lead={header.tagline?.trim() || BOARD_LEAD_FALLBACK}
        image={header.imageUrl}
        upLink={{ href: "/club", label: "De club" }}
      />

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Description + members are ONE section, not two same-colour ones
          stacking (#2479 rule 3). Before this ticket the description was
          `pt-12`-only, so the two read as one continuous block with the
          members section's own top padding as the only gap between them;
          padding both sides of the description too (rule 1, no one-sided
          sections) would otherwise double that gap into a new violation
          with no seam and no colour change to justify it. Merged instead —
          `mt-12` on the members block reproduces the old 48px rhythm as an
          internal gap rather than a second section boundary. */}
      {showDescription || hasMembers ? (
        <PageContainer as="section" className="py-12 sm:py-16">
          {showDescription ? (
            // Shared by /club/bestuur, /club/angels and /club/jeugdbestuur
            // (#2436). The rule + gutter sit outside the clamp so the text
            // column measures the full prose token, not the token minus its
            // own padding.
            <div className="border-jersey-deep border-l-4 pl-6">
              <div className="text-ink font-body max-w-[var(--container-prose)] text-base leading-relaxed">
                <PortableText value={body} components={bodyComponents} />
              </div>
            </div>
          ) : null}

          {hasMembers ? (
            <div className={showDescription ? "mt-12" : undefined}>
              <SectionHeader
                title="De leden"
                size="display-md"
                emphasis={{ text: "." }}
              />
              <TeamStaff staff={staff} heading="De leden" />
            </div>
          ) : null}
        </PageContainer>
      ) : null}

      <BoardCtaBand />
    </>
  );
}
