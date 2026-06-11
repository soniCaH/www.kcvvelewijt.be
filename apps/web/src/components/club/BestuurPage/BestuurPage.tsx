/**
 * BestuurPage — board pages (`/club/bestuur`, `/club/jeugdbestuur`,
 * `/club/angels`) on the Phase 7 redesign spine (design contract 7b1 + 7b2):
 *
 *   <BoardHero> (jersey-deep-dark, group photo, warm "." accent)
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
import { EditorialHeading, StripedSeam } from "@/components/design-system";
import {
  TeamStaff,
  type TeamStaffMemberData,
} from "@/components/team/TeamStaff";
import { hasRenderableBioContent } from "@/lib/portable-text/findPullquoteText";
import { BoardHero } from "@/components/club/BoardHero";
import { BoardCtaBand } from "@/components/club/BoardCtaBand";

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
  /** Team tagline (hero lead — falls back to a default in <BoardHero>). */
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
      <BoardHero
        name={header.name}
        tagline={header.tagline}
        imageUrl={header.imageUrl}
      />

      <StripedSeam colorPair="ink-cream" height="md" />

      {showDescription ? (
        <section className="mx-auto max-w-5xl px-4 pt-12">
          <div className="border-jersey-deep text-ink font-body max-w-3xl border-l-4 pl-6 text-base leading-relaxed [&_p]:mb-4 [&_p:last-child]:mb-0">
            <PortableText value={body} components={bodyComponents} />
          </div>
        </section>
      ) : null}

      {hasMembers ? (
        <section className="mx-auto max-w-5xl px-4 py-12">
          <EditorialHeading
            level={2}
            size="display-md"
            emphasis={{ text: "." }}
            className="mb-6"
          >
            De leden
          </EditorialHeading>
          <TeamStaff staff={staff} />
        </section>
      ) : null}

      <BoardCtaBand />
    </>
  );
}
