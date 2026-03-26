import { useCallback, useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics/track-event";

const DWELL_THRESHOLDS = [5, 15, 30];

export function useResponsibilityAnalytics() {
  const hadContactInteractionRef = useRef(false);
  const lastRoleRef = useRef<string | null>(null);
  const lastQueryLengthRef = useRef(0);
  const lastHadResultsRef = useRef(false);
  const dwellTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const trackRoleSelected = useCallback((role: string) => {
    lastRoleRef.current = role;
    trackEvent("responsibility_role_selected", { role });
  }, []);

  const trackSearch = useCallback(
    (query: string, role: string, resultsCount: number) => {
      lastQueryLengthRef.current = query.length;
      lastHadResultsRef.current = resultsCount > 0;
      trackEvent("responsibility_search", {
        query_length: query.length,
        role,
        results_count: resultsCount,
      });
    },
    [],
  );

  const trackNoResults = useCallback((queryText: string, role: string) => {
    trackEvent("responsibility_no_results", {
      query_text: queryText,
      role,
    });
  }, []);

  const trackSuggestionClicked = useCallback(
    (pathId: string, category: string, index: number) => {
      trackEvent("responsibility_suggestion_clicked", {
        path_id: pathId,
        category,
        position: index + 1,
      });
    },
    [],
  );

  const trackContactClicked = useCallback(
    (pathId: string, contactType: "email" | "phone") => {
      hadContactInteractionRef.current = true;
      trackEvent("responsibility_contact_clicked", {
        path_id: pathId,
        contact_type: contactType,
      });
    },
    [],
  );

  const trackOrganigramLink = useCallback(
    (pathId: string, memberId: string) => {
      hadContactInteractionRef.current = true;
      trackEvent("responsibility_organigram_link", {
        path_id: pathId,
        member_id: memberId,
      });
    },
    [],
  );

  const trackStepLinkClicked = useCallback(
    (pathId: string, stepIndex: number) => {
      trackEvent("responsibility_step_link_clicked", {
        path_id: pathId,
        step_index: stepIndex,
      });
    },
    [],
  );

  const clearDwellTimers = useCallback(() => {
    for (const timer of dwellTimersRef.current) {
      clearTimeout(timer);
    }
    dwellTimersRef.current = [];
  }, []);

  const startDwell = useCallback(
    (pathId: string, category: string) => {
      clearDwellTimers();
      const timers = DWELL_THRESHOLDS.map((seconds) =>
        setTimeout(() => {
          trackEvent("responsibility_dwell", {
            path_id: pathId,
            dwell_seconds: seconds,
            category,
          });
        }, seconds * 1000),
      );
      dwellTimersRef.current = timers;
    },
    [clearDwellTimers],
  );

  const stopDwell = useCallback(() => {
    clearDwellTimers();
  }, [clearDwellTimers]);

  // Abandon tracking on unmount
  useEffect(() => {
    return () => {
      clearDwellTimers();
      if (lastRoleRef.current && !hadContactInteractionRef.current) {
        trackEvent("responsibility_abandon", {
          role: lastRoleRef.current,
          query_length: lastQueryLengthRef.current,
          had_results: lastHadResultsRef.current,
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup-only effect, refs are stable
  }, []);

  return {
    trackRoleSelected,
    trackSearch,
    trackNoResults,
    trackSuggestionClicked,
    trackContactClicked,
    trackOrganigramLink,
    trackStepLinkClicked,
    startDwell,
    stopDwell,
  };
}
