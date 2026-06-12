"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { OrgChartMember, OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";
import { useOrganigramAnalytics } from "@/hooks/useOrganigramAnalytics";
import { MemberDetailPanel } from "@/components/organigram/MemberDetailPanel";

/**
 * `<HubMemberPanel>` — the Phase 7 `/hulp` host that wires the single
 * `<MemberDetailPanel>` to both entry points (design lock `7o5`).
 *
 *  - **Directory:** one native click-delegation listener on the wrapper catches
 *    `data-member-card` cards (interactive `<OrgPersonCard>`s) and opens the
 *    panel — never per-card handlers, and the verkenner's own `data-node-id`
 *    nav nodes are ignored because only directory cards carry `data-member-card`.
 *  - **Verkenner:** the explorer calls `openMember(node, …)` via context from its
 *    centred-node "Contactgegevens" trigger.
 *
 * Owns the `?member=` deep-link: restores the panel on load and silently syncs
 * the URL (`member` + the selected `holder`) on open / holder-switch, clearing it
 * on close. Fires `organigram_member_clicked` (hashed selected holder) on every
 * open and holder-switch via `onMemberShown`.
 */

type HubPanelView = "cards" | "chart";

interface OpenMemberOptions {
  /** Element focus returns to on close (the launcher). */
  trigger?: HTMLElement | null;
  /** Analytics surface the open originated from. */
  view: HubPanelView;
  /** Holder to land on (deep-link restore); falls back to holder #1. */
  holderId?: string;
}

interface HubMemberPanelContextValue {
  openMember: (node: OrgChartNode, options: OpenMemberOptions) => void;
  /**
   * Open the panel for a node by its id — the resolution path for cross-links
   * that only carry a `nodeId` (e.g. the finder's "Toon in structuur →", which
   * has the responsibility contact's node but not the `OrgChartNode`). No-op
   * when the id is unknown.
   */
  openMemberById: (nodeId: string, options: OpenMemberOptions) => void;
}

const HubMemberPanelContext = createContext<HubMemberPanelContextValue | null>(
  null,
);

/** Access the hub panel opener (null outside a `<HubMemberPanel>`). */
export function useHubMemberPanel(): HubMemberPanelContextValue | null {
  return useContext(HubMemberPanelContext);
}

export interface HubMemberPanelProps {
  /** All organigram positions (`StaffRepository.findAll()` shape). */
  nodes: OrgChartNode[];
  /** Responsibility paths — the panel's "Helpt met" chips. */
  responsibilityPaths?: ResponsibilityPath[];
  children: ReactNode;
}

/** Silent URL write — no history entry, no navigation/re-fetch. */
function replaceMemberParams(nodeId: string | null, holderId: string | null) {
  const params = new URLSearchParams(window.location.search);
  if (nodeId) params.set("member", nodeId);
  else params.delete("member");
  if (holderId) params.set("holder", holderId);
  else params.delete("holder");
  const qs = params.toString();
  const next = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
  window.history.replaceState(null, "", next);
}

export function HubMemberPanel({
  nodes,
  responsibilityPaths = [],
  children,
}: HubMemberPanelProps) {
  const nodeById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );

  const [openNode, setOpenNode] = useState<OrgChartNode | null>(null);
  const [open, setOpen] = useState(false);
  const [initialHolderId, setInitialHolderId] = useState<string | undefined>(
    undefined,
  );
  const viewRef = useRef<HubPanelView>("cards");
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { trackMemberClicked } = useOrganigramAnalytics();

  const openMember = useCallback(
    (node: OrgChartNode, { trigger, view, holderId }: OpenMemberOptions) => {
      returnFocusRef.current = trigger ?? null;
      viewRef.current = view;
      setOpenNode(node);
      setInitialHolderId(holderId);
      setOpen(true);
    },
    [],
  );

  const openMemberById = useCallback(
    (nodeId: string, options: OpenMemberOptions) => {
      const node = nodeById.get(nodeId);
      if (node) openMember(node, options);
    },
    [nodeById, openMember],
  );

  const handleClose = useCallback(() => {
    setOpen(false);
    // Clear the shown node so a reopen of the same position is a node change —
    // the panel resets to holder #1 (7o5) rather than resuming the last holder.
    setOpenNode(null);
    setInitialHolderId(undefined);
    replaceMemberParams(null, null);
  }, []);

  // Directory delegation: one listener, target only `data-member-card` cards.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const card = target?.closest<HTMLElement>("[data-member-card]");
      const id = card?.dataset.nodeId;
      if (!id) return;
      const node = nodeById.get(id);
      if (!node) return;
      openMember(node, { trigger: card, view: "cards" });
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [nodeById, openMember]);

  // Deep-link restore on first mount: a one-time read of the URL (an external
  // system) — the panel is closed during SSR and opens after hydration when
  // `?member=` is present, so the synchronous open here is intentional.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const memberId = params.get("member");
    if (!memberId) return;
    const node = nodeById.get(memberId);
    if (!node) return;
    const holderId = params.get("holder");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    openMember(node, { view: "cards", ...(holderId ? { holderId } : {}) });
    // Run once on mount — the initial URL is the only deep-link source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMemberShown = useCallback(
    (node: OrgChartNode, holder: OrgChartMember | null) => {
      trackMemberClicked({ members: holder ? [holder] : [] }, viewRef.current);
      replaceMemberParams(node.id, holder?.id ?? null);
    },
    [trackMemberClicked],
  );

  const contextValue = useMemo<HubMemberPanelContextValue>(
    () => ({ openMember, openMemberById }),
    [openMember, openMemberById],
  );

  return (
    <HubMemberPanelContext.Provider value={contextValue}>
      <div ref={containerRef}>{children}</div>
      <MemberDetailPanel
        node={openNode}
        open={open}
        onClose={handleClose}
        responsibilityPaths={responsibilityPaths}
        initialHolderId={initialHolderId}
        returnFocusRef={returnFocusRef}
        onMemberShown={onMemberShown}
      />
    </HubMemberPanelContext.Provider>
  );
}
