import { useCallback } from "react";
import { trackEvent } from "@/lib/analytics/track-event";
import { sanitizeQuery } from "@/lib/analytics/sanitize-query";
import { hashMemberId } from "@/lib/analytics/hash-member-id";
import type { OrgChartNode } from "@/types/organigram";

type ViewType = "cards" | "chart" | "responsibilities";
type ViewSource = "tab" | "swipe" | "keyboard";

export { hashMemberId };

export function useOrganigramAnalytics() {
  const trackViewChanged = useCallback((view: ViewType, source: ViewSource) => {
    trackEvent("organigram_view_changed", { view, source });
  }, []);

  /**
   * Track a node click. Uses the staffMember._id (members[0].id), NOT the
   * organigramNode._id (node.id), so analytics consistently identify the person.
   *
   * - Vacant nodes (0 members): event fires without member_id.
   * - Single nodes (1 member): member_id = hashed members[0].id.
   * - Shared nodes (2+ members): member_id = hashed members[0].id — the first
   *   listed member is treated as the primary contact for tracking purposes.
   *   Per-member click tracking can be added later if the contact overlay or
   *   modal exposes individual member actions.
   */
  const trackMemberClicked = useCallback(
    (node: Pick<OrgChartNode, "members">, view: ViewType) => {
      const staffMemberId = node.members[0]?.id;
      trackEvent("organigram_member_clicked", {
        ...(staffMemberId ? { member_id: hashMemberId(staffMemberId) } : {}),
        view,
      });
    },
    [],
  );

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
