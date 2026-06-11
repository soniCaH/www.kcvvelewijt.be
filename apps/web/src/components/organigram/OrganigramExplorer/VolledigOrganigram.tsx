"use client";

import { useMemo, useRef } from "react";
import type { OrgChartNode } from "@/types/organigram";
import { cn } from "@/lib/utils/cn";
import { deriveCardState } from "@/components/organigram/OrgPersonCard";
import { ArrowsOut, DownloadSimple } from "@/lib/icons.redesign";
import { holderLabel } from "./SpotlightNodeCard";
import { buildSpotlightTree, childrenOf, CLUB_ROOT_ID } from "./spotlight-tree";

/**
 * `<VolledigOrganigram>` — the full reporting tree as a pure-CSS DOM box chart
 * (no canvas, no library). Two jobs in one component (competitive analysis 7o3b
 * §5): it is the **accessible fallback** to the spotlight (a real nested
 * list/tree, keyboard- and screen-reader-navigable) AND the **print source** for
 * the "Download als PDF" — the whole organigram on one A4 sheet (the kept 7o7
 * print view). The A4 print stylesheet is injected only for the duration of the
 * print so it can never affect an unrelated page's print.
 */

export interface VolledigOrganigramProps {
  nodes: OrgChartNode[];
  /** When provided, each node box becomes a button that drills into the explorer. */
  onNodeClick?: (id: string, trigger: HTMLElement) => void;
  /** When provided, renders an "Open verkenner ⤢" button in the toolbar. */
  onOpenExplorer?: (trigger: HTMLElement) => void;
  className?: string;
}

const A4_LANDSCAPE_PX = { width: 277 * 3.7795, height: 190 * 3.7795 }; // printable area at 96dpi, 10mm margins

function OrgBranch({
  node,
  childrenByParent,
  onNodeClick,
  isRoot = false,
}: {
  node: OrgChartNode;
  childrenByParent: (id: string) => OrgChartNode[];
  onNodeClick?: (id: string, trigger: HTMLElement) => void;
  isRoot?: boolean;
}) {
  const kids = childrenByParent(node.id);
  const state = isRoot ? "root" : deriveCardState(node.members.length);
  const boxClass = cn(
    "border-ink inline-flex min-w-[64px] flex-col border-2 px-2 py-1 text-center",
    state === "vacant" ? "bg-warm" : "bg-cream",
    onNodeClick &&
      "cursor-pointer transition-transform hover:-translate-y-0.5 motion-reduce:transition-none",
  );
  const content = (
    <>
      <span className="font-display text-ink text-[9px] leading-[1.1] font-semibold">
        {node.title}
      </span>
      <span className="text-ink-muted font-mono text-[7px] tracking-[0.04em] uppercase">
        {isRoot ? "de club" : holderLabel(node)}
      </span>
    </>
  );

  return (
    <li>
      {onNodeClick ? (
        <button
          type="button"
          data-state={state}
          onClick={(e) => onNodeClick(node.id, e.currentTarget)}
          aria-label={`Open ${node.title} in de verkenner`}
          className={boxClass}
        >
          {content}
        </button>
      ) : (
        <div data-state={state} className={boxClass}>
          {content}
        </div>
      )}
      {kids.length > 0 && (
        <ul>
          {kids.map((kid) => (
            <OrgBranch
              key={kid.id}
              node={kid}
              childrenByParent={childrenByParent}
              onNodeClick={onNodeClick}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function VolledigOrganigram({
  nodes,
  onNodeClick,
  onOpenExplorer,
  className,
}: VolledigOrganigramProps) {
  const tree = useMemo(() => buildSpotlightTree(nodes), [nodes]);
  const chartRef = useRef<HTMLDivElement>(null);
  const childrenByParent = (id: string) => childrenOf(tree, id);
  const root = tree.byId.get(CLUB_ROOT_ID) ?? nodes[0];

  const handleDownload = () => {
    // Idempotent — clear any leftover from a previous (or cancelled) print.
    document.getElementById("vo-print-style")?.remove();

    const chart = chartRef.current;
    if (chart) {
      const scale = Math.min(
        A4_LANDSCAPE_PX.width / chart.scrollWidth,
        A4_LANDSCAPE_PX.height / chart.scrollHeight,
        1,
      );
      document.documentElement.style.setProperty(
        "--vo-print-scale",
        String(scale),
      );
    }

    const style = document.createElement("style");
    style.id = "vo-print-style";
    style.media = "print";
    // `overflow: hidden` clips any box that scale-to-fit can't shrink, so the
    // chart can never spill onto a second blank sheet.
    style.textContent = `
      @page { size: A4 landscape; margin: 8mm; }
      body * { visibility: hidden !important; }
      .vo-print, .vo-print * { visibility: visible !important; }
      .vo-print { position: fixed; inset: 0; padding: 0; margin: 0; overflow: hidden; }
      .vo-no-print { display: none !important; }
      .vo-chart { transform: scale(var(--vo-print-scale, 1)); transform-origin: top left; }
    `;
    document.head.appendChild(style);

    window.addEventListener(
      "afterprint",
      () => {
        document.getElementById("vo-print-style")?.remove();
        document.documentElement.style.removeProperty("--vo-print-scale");
      },
      { once: true },
    );
    window.print();
  };

  if (!root) return null;

  return (
    <div
      data-testid="volledig-organigram"
      className={cn("vo-print", className)}
    >
      <div className="vo-no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-soft max-w-[60ch] text-sm leading-relaxed">
          De volledige rapporteringsstructuur in één overzicht. Klik een functie
          om ze in de verkenner te openen, of druk het geheel af.
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {onOpenExplorer && (
            <button
              type="button"
              onClick={(e) => onOpenExplorer(e.currentTarget)}
              aria-haspopup="dialog"
              className="border-ink bg-jersey-deep text-cream shadow-paper-sm focus-visible:outline-ink flex items-center gap-2 border-2 px-4 py-2.5 font-mono text-xs font-bold tracking-wide uppercase transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <ArrowsOut size={16} aria-hidden />
              Open verkenner ⤢
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            className="border-ink bg-cream-soft text-ink shadow-paper-sm focus-visible:outline-ink flex items-center gap-2 border-2 px-4 py-2.5 font-mono text-xs font-bold tracking-wide uppercase transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <DownloadSimple size={16} aria-hidden />
            Download als PDF
          </button>
        </div>
      </div>

      <div ref={chartRef} className="vo-chart overflow-x-auto pb-2">
        {/* `safe center` centres a chart that fits but left-aligns (and stays
            scrollable) when it's wider than the viewport — otherwise flex
            centering pushes the left edge off-screen and out of scroll reach. */}
        <ul className="vo-tree" style={{ justifyContent: "safe center" }}>
          <OrgBranch
            node={root}
            childrenByParent={childrenByParent}
            {...(onNodeClick ? { onNodeClick } : {})}
            isRoot={root.id === CLUB_ROOT_ID}
          />
        </ul>
      </div>
    </div>
  );
}
