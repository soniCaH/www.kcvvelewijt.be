"use client";

import { useRef, useState } from "react";
import type { OrgChartNode } from "@/types/organigram";
import { useHubMemberPanel } from "@/components/organigram/HubMemberPanel";
import { OrganigramExplorer } from "./OrganigramExplorer";
import { VolledigOrganigram } from "./VolledigOrganigram";

/**
 * Ties the on-page full-organigram chart to the fullscreen `<OrganigramExplorer>`:
 * clicking any node in the chart (or the "Blader door het organigram ⤢" button) opens the
 * explorer focused on that node. Owns the explorer's open/focus state and points
 * `returnFocusRef` at whichever element triggered the open, so focus returns
 * there on close.
 */
export interface OrganigramOverviewProps {
  nodes: OrgChartNode[];
}

export function OrganigramOverview({ nodes }: OrganigramOverviewProps) {
  const hubPanel = useHubMemberPanel();
  const [open, setOpen] = useState(false);
  const [focusId, setFocusId] = useState<string | undefined>(undefined);
  // Bumped on every open so the explorer remounts fresh and initialises directly
  // at the target node — no flash of the default node before it re-centres.
  const [openKey, setOpenKey] = useState(0);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const openAt = (id: string | undefined, trigger: HTMLElement) => {
    // Dedup: re-triggering the exact same open (already open, same node + same
    // trigger) is a no-op — avoids a needless explorer remount via setOpenKey.
    if (open && id === focusId && returnFocusRef.current === trigger) return;
    returnFocusRef.current = trigger;
    setFocusId(id);
    setOpen(true);
    setOpenKey((key) => key + 1);
  };

  return (
    <>
      <VolledigOrganigram
        nodes={nodes}
        onNodeClick={(id, trigger) => openAt(id, trigger)}
        onOpenExplorer={(trigger) => openAt(undefined, trigger)}
      />
      <OrganigramExplorer
        key={openKey}
        nodes={nodes}
        open={open}
        onClose={() => setOpen(false)}
        {...(focusId ? { initialFocusId: focusId } : {})}
        returnFocusRef={returnFocusRef}
        {...(hubPanel
          ? {
              onOpenMember: (node, trigger) =>
                hubPanel.openMember(node, { trigger, view: "chart" }),
            }
          : {})}
      />
    </>
  );
}
