"use client";

import { useRef, type ReactNode } from "react";
import { useDelegatedClick } from "@/hooks/useDelegatedClick";
import { useSponsorAnalytics } from "@/hooks/useSponsorAnalytics";
import { readSponsorAttrs } from "@/lib/analytics/sponsor-attrs";

export interface TeamSponsorLineTrackerProps {
  teamSlug: string;
  children: ReactNode;
}

/**
 * Click delegation for `<TeamSponsorLine>` (#3652): one listener on the line,
 * keyed on the `data-sponsor-id` marker its links carry, so the line itself
 * stays a server component. It sits outside `<SponsorWallTracker>`, so a name
 * click is counted here and nowhere else.
 */
export const TeamSponsorLineTracker = ({
  teamSlug,
  children,
}: TeamSponsorLineTrackerProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { trackSponsorTeamLineClick } = useSponsorAnalytics();

  useDelegatedClick(ref, {
    selector: "[data-sponsor-id]",
    onMatch: (el) => {
      const sponsor = readSponsorAttrs(el);
      if (sponsor) {
        trackSponsorTeamLineClick({ sponsorId: sponsor.sponsorId, teamSlug });
      }
    },
  });

  return <div ref={ref}>{children}</div>;
};
