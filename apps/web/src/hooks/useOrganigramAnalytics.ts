import { useCallback } from "react";
import { trackEvent } from "@/lib/analytics/track-event";
import { sanitizeQuery } from "@/lib/analytics/sanitize-query";

type ViewType = "cards" | "chart" | "responsibilities";
type ViewSource = "tab" | "swipe" | "keyboard";

/** djb2 hash — non-reversible, synchronous, no external deps */
export function hashMemberId(id: string): string {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) + hash + id.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16);
}

export function useOrganigramAnalytics() {
  const trackViewChanged = useCallback((view: ViewType, source: ViewSource) => {
    trackEvent("organigram_view_changed", { view, source });
  }, []);

  const trackMemberClicked = useCallback((memberId: string, view: ViewType) => {
    trackEvent("organigram_member_clicked", {
      member_id: hashMemberId(memberId),
      view,
    });
  }, []);

  const trackSearchUsed = useCallback((queryText: string) => {
    trackEvent("organigram_search_used", {
      query_text: sanitizeQuery(queryText),
    });
  }, []);

  const trackDepartmentFiltered = useCallback((department: string) => {
    trackEvent("organigram_department_filtered", { department });
  }, []);

  const trackExportPng = useCallback(() => {
    trackEvent("organigram_export_png", undefined);
  }, []);

  return {
    trackViewChanged,
    trackMemberClicked,
    trackSearchUsed,
    trackDepartmentFiltered,
    trackExportPng,
  };
}
