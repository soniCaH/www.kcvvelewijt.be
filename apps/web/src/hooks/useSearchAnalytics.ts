import { useCallback } from "react";
import { trackEvent } from "@/lib/analytics/track-event";

export function useSearchAnalytics() {
  const trackSearchSubmitted = useCallback((queryText: string) => {
    trackEvent("search_submitted", {
      query_text: queryText,
      query_length: queryText.length,
    });
  }, []);

  const trackResultsShown = useCallback(
    (resultsCount: number, queryText: string) => {
      trackEvent("search_results_shown", {
        results_count: resultsCount,
        query_text: queryText,
      });
    },
    [],
  );

  const trackNoResults = useCallback((queryText: string) => {
    trackEvent("search_no_results", {
      query_text: queryText,
    });
  }, []);

  const trackFilterChanged = useCallback((filterType: string) => {
    trackEvent("search_filter_changed", {
      filter_type: filterType,
    });
  }, []);

  const trackResultClicked = useCallback(
    (resultType: string, resultTitle: string, index: number) => {
      trackEvent("search_result_clicked", {
        result_type: resultType,
        result_title: resultTitle,
        position: index + 1,
      });
    },
    [],
  );

  return {
    trackSearchSubmitted,
    trackResultsShown,
    trackNoResults,
    trackFilterChanged,
    trackResultClicked,
  };
}
