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
  /**
   * Render the full box chart behind a quiet "Bekijk het volledige organigram →"
   * disclosure (7o9 · 2 = directory-first). The directory is the default; the
   * chart (+ its spotlight verkenner / PDF) is one deliberate click away, rather
   * than a co-equal always-on section.
   */
  collapsible?: boolean;
}

export function OrganigramOverview({
  nodes,
  collapsible = false,
}: OrganigramOverviewProps) {
  const hubPanel = useHubMemberPanel();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(!collapsible);
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
      {collapsible && !expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-expanded={false}
          className="border-ink bg-cream text-jersey-deep shadow-paper-sm focus-visible:outline-ink inline-flex items-center gap-2 border-2 px-4 py-2.5 font-mono text-xs font-bold tracking-wide uppercase transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Bekijk het volledige organigram →
        </button>
      ) : (
        <>
          {collapsible && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-expanded
              className="text-ink-muted hover:text-ink mb-3 inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.04em] uppercase transition-colors"
            >
              ↑ Verberg het organigram
            </button>
          )}
          <VolledigOrganigram
            nodes={nodes}
            onNodeClick={(id, trigger) => openAt(id, trigger)}
            onOpenExplorer={(trigger) => openAt(undefined, trigger)}
          />
        </>
      )}
      <OrganigramExplorer
        key={openKey}
        nodes={nodes}
        open={open}
        onClose={() => setOpen(false)}
        {...(focusId ? { initialFocusId: focusId } : {})}
        returnFocusRef={returnFocusRef}
        {...(hubPanel
          ? {
              onOpenMember: (node) => {
                // B2 — never stack two modal dialogs: collapse the verkenner as
                // the person panel takes over. Return focus to the verkenner's
                // own launcher (a live page element) rather than the now-
                // unmounting in-chart node, so closing the panel lands the user
                // back on the page.
                setOpen(false);
                hubPanel.openMember(node, {
                  trigger: returnFocusRef.current,
                  view: "chart",
                });
              },
            }
          : {})}
      />
    </>
  );
}
