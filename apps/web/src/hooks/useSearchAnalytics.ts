import { useCallback } from "react";
import { trackEvent } from "@/lib/analytics/track-event";
import { sanitizeQuery } from "@/lib/analytics/sanitize-query";
import type { SearchResultType } from "@/types/search";

export function useSearchAnalytics() {
  const trackSearchSubmitted = useCallback((queryText: string) => {
    trackEvent("search_submitted", {
      query_text: sanitizeQuery(queryText),
      query_length: queryText.length,
    });
  }, []);

  const trackResultsShown = useCallback(
    (resultsCount: number, queryText: string) => {
      trackEvent("search_results_shown", {
        results_count: resultsCount,
        query_text: sanitizeQuery(queryText),
      });
    },
    [],
  );

  const trackNoResults = useCallback((queryText: string) => {
    trackEvent("search_no_results", {
      query_text: sanitizeQuery(queryText),
      query_length: queryText.length,
    });
  }, []);

  // A lexical search failure (#2824) — fires whether or not the notice was
  // suppressed by a high-confidence semantic answer, so the suppression
  // (see SearchInterface's failed-search gating) costs no visibility.
  // `answer_shown` is collected but deliberately NOT registered as a GA4
  // custom dimension (taxonomy already at the 50-dimension cap) — the raw
  // event count is the alarm.
  const trackSearchFailed = useCallback(
    (queryText: string, answerShown: boolean) => {
      trackEvent("search_failed", {
        query_text: sanitizeQuery(queryText),
        query_length: queryText.length,
        answer_shown: answerShown,
      });
    },
    [],
  );

  // A closed union of slug-shaped values — `filter_type` is shared with
  // `match_agenda_filter` and `empty_state_undo`, which both send slugs (#2719).
  const trackFilterChanged = useCallback(
    (filterType: SearchResultType | "all") => {
      trackEvent("search_filter_changed", {
        filter_type: filterType,
      });
    },
    [],
  );

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
    trackSearchFailed,
    trackFilterChanged,
    trackResultClicked,
  };
}
