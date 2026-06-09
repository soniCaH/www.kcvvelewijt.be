import { useCallback } from "react";
import { trackEvent } from "@/lib/analytics/track-event";

/**
 * Analytics for the `/club/ultras` page (PRD redesign-phase-7-ultras §4):
 * `ultras_view` (page view) and `ultras_join_click` (the "Word lid via
 * Facebook" CTA — fired from the hero stamp and the "Lid worden" link alike).
 *
 * No PII — neither event carries parameters.
 */
export function useUltrasAnalytics() {
  const trackUltrasView = useCallback(() => {
    trackEvent("ultras_view");
  }, []);

  const trackUltrasJoinClick = useCallback(() => {
    trackEvent("ultras_join_click");
  }, []);

  return { trackUltrasView, trackUltrasJoinClick };
}
