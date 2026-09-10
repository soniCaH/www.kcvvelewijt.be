"use client";

import {
  EditorialHeading,
  JerseyShirt,
  LinkButton,
  MonoLabel,
  TapedCard,
} from "@/components/design-system";
import { trackEvent } from "@/lib/analytics/track-event";
import { cn } from "@/lib/utils/cn";

/**
 * <TeamEnrolmentCta> — youth "Word lid" recruitment ad for `/ploegen/[slug]`.
 *
 * A standalone fanzine section, mounted in `page.tsx` after `#info` and
 * before `<SponsorsSection>` (moved there from between <SquadGrid> and
 * <TeamStaff> by #2639, decided by #2543 — see that ticket and
 * `enrolment-cta-locked.md` §2's superseded entry for why) — no section-nav
 * anchor — it's a CTA, not navigable content — and links to the static
 * `/club/word-lid` route. Out-of-PRD addition on top of the shipped
 * Phase 6.C page; design locked in `enrolment-cta-locked.md` (#1949).
 *
 * Youth-only: returns `null` for senior teams. Senior recruitment runs via
 * trials/contact, and `/club/word-lid` is in practice the youth enrolment
 * route (target of `/jeugd`, the homepage `YouthSection`, `JeugdEditorialGrid`,
 * `ResponsibilityBlock`).
 *
 * Visual (V2, locked): a STATIC `<TapedCard bg="jersey-deep">` (only the
 * `<LinkButton>` presses — no card-level hover), cream type with a warm accent,
 * and a corner `<JerseyShirt>` carrying the team's age group as chest letter.
 */

const ENROLMENT_HREF = "/club/word-lid";

export interface TeamEnrolmentCtaProps {
  /** Render only for youth teams; senior returns `null`. */
  teamType: "youth" | "senior";
  /** Team slug — the `team_slug` analytics param on the click event. */
  teamSlug: string;
  /**
   * Normalised age group (e.g. "U13") used as the jersey chest letter.
   * Omitted → the jersey renders without a letter (still a valid silhouette).
   */
  ageGroup?: string;
  className?: string;
}

export const TeamEnrolmentCta = ({
  teamType,
  teamSlug,
  ageGroup,
  className,
}: TeamEnrolmentCtaProps) => {
  if (teamType !== "youth") return null;

  const handleClick = () => {
    trackEvent("team_enrolment_cta_click", { team_slug: teamSlug });
  };

  return (
    // Cream and warm text on jersey-deep used to be sub-AA here, kept
    // deliberately for YouthSection parity after jersey-deep-dark was offered
    // and declined (enrolment-cta-locked.md §4). #2395 resolved it from the
    // other end by darkening the token itself, with no change needed here.
    <TapedCard
      bg="jersey-deep"
      shadow="soft"
      padding="lg"
      className={cn("overflow-hidden", className)}
    >
      {/* Corner jersey motif — inset from the top-right, age group as chest
          letter. Hidden below 640px (mirrors <ClubshopBanner>) so the narrow
          viewport gets a clean full-width stack instead of a crowded gutter.
          Decorative; the aria-hidden silhouette lives inside <JerseyShirt>. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-5 right-6 z-0 hidden sm:block"
      >
        <JerseyShirt
          letterOverlay={ageGroup}
          className="h-35 w-35 rotate-[4deg]"
        />
      </div>

      {/* Label + heading reserve the motif gutter (sm+) so they never run
          behind the jersey. The lead + button flow full-width below it. */}
      <div className="relative z-10 sm:pr-44">
        <div className="mb-3">
          <MonoLabel tone="cream" size="md">
            Word lid
          </MonoLabel>
        </div>
        <EditorialHeading
          level={2}
          size="display-lg"
          tone="cream"
          emphasis={{ text: "Elewijt", tone: "warm" }}
        >
          Sluit je aan bij de jeugd van Elewijt.
        </EditorialHeading>
      </div>

      <p className="text-cream relative z-10 mt-4 mb-6 text-base leading-relaxed">
        Er is maar één plezante compagnie — en die begint op het veld.
      </p>

      <LinkButton
        href={ENROLMENT_HREF}
        variant="inverted"
        withArrow
        onClick={handleClick}
        className="relative z-10"
      >
        Word lid
      </LinkButton>
    </TapedCard>
  );
};
