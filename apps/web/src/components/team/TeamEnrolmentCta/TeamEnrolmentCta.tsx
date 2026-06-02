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
 * A standalone fanzine section that sits between <SquadGrid> and <TeamStaff>
 * (no section-nav anchor — it's a CTA, not navigable content) and links to the
 * static `/club/inschrijven` route. Out-of-PRD addition on top of the shipped
 * Phase 6.C page; design locked in `enrolment-cta-locked.md` (#1949).
 *
 * Youth-only: returns `null` for senior teams. Senior recruitment runs via
 * trials/contact, and `/club/inschrijven` is in practice the youth enrolment
 * route (target of `/jeugd`, the homepage `YouthSection`, `JeugdEditorialGrid`,
 * `ResponsibilityBlock`).
 *
 * Visual (V2, locked): a STATIC `<TapedCard bg="jersey-deep">` (only the
 * `<LinkButton>` presses — no card-level hover), cream type with a warm accent,
 * and a corner `<JerseyShirt>` carrying the team's age group as chest letter.
 */

const ENROLMENT_HREF = "/club/inschrijven";

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
    // jersey-deep (#008755) is sub-AA for cream/warm text (cream 4.04:1, warm
    // accent 2.74:1). Kept deliberately for YouthSection parity; the
    // @storybook/addon-a11y check runs in warn mode (non-failing). The darker
    // jersey-deep-dark passes AA but was declined. See enrolment-cta-locked.md §4.
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
          ariaLabel=""
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
