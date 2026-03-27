import { useCallback } from "react";
import { trackEvent } from "@/lib/analytics/track-event";

type ViewType = "cards" | "chart" | "responsibilities";
type ViewSource = "tab" | "swipe" | "keyboard";

export function useOrganigramAnalytics() {
  const trackViewChanged = useCallback((view: ViewType, source: ViewSource) => {
    trackEvent("organigram_view_changed", { view, source });
  }, []);

  const trackMemberClicked = useCallback((memberId: string, view: ViewType) => {
    trackEvent("organigram_member_clicked", { member_id: memberId, view });
  }, []);

  const trackSearchUsed = useCallback((queryText: string) => {
    trackEvent("organigram_search_used", { query_text: queryText });
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
