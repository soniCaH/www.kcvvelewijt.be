"use client";

import { useRef, type ReactNode } from "react";
import type { MatchStatus } from "@kcvv/api-contract";
import { useDelegatedClick } from "@/hooks/useDelegatedClick";
import { trackEvent } from "@/lib/analytics/track-event";

export interface MatchPracticalAnalyticsProps {
  matchId: number;
  status: MatchStatus;
  /** Applied to the delegating element, so the page owns the spacing. */
  className?: string;
  children: ReactNode;
}

/**
 * Client analytics shell around the match page's practical link (#3634).
 * Delegates a click on the `data-match-practical` anchor to
 * `match_practical_click`, so the link itself stays server-rendered — mirrors
 * `<ArticleCtaAnalytics>`. The destination comes off the anchor's own `href`,
 * as `<FooterAnalytics>` does, so the route lives in one place. No team names
 * or titles: `match_id` and `status` are the same pair `match_detail_view`
 * sends.
 *
 * The page only mounts this wrapper when the link renders (a Match with a
 * venue), so an away Match carries no listener.
 */
export const MatchPracticalAnalytics = ({
  matchId,
  status,
  className,
  children,
}: MatchPracticalAnalyticsProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useDelegatedClick(ref, {
    selector: "[data-match-practical]",
    onMatch: (el) => {
      const destination = el.getAttribute("href");
      if (!destination) return;
      trackEvent("match_practical_click", {
        match_id: matchId,
        status,
        destination,
      });
    },
  });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};
