"use client";

import { useMemo, useRef } from "react";
import type { OrgChartNode } from "@/types/organigram";
import { cn } from "@/lib/utils/cn";
import { deriveCardState } from "@/components/organigram/OrgPersonCard";
import { DownloadSimple } from "@/lib/icons.redesign";
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
  className?: string;
}

const A4_LANDSCAPE_PX = { width: 277 * 3.7795, height: 190 * 3.7795 }; // printable area at 96dpi, 10mm margins

function OrgBranch({
  node,
  childrenByParent,
  isRoot = false,
}: {
  node: OrgChartNode;
  childrenByParent: (id: string) => OrgChartNode[];
  isRoot?: boolean;
}) {
  const kids = childrenByParent(node.id);
  const state = isRoot ? "root" : deriveCardState(node.members.length);
  return (
    <li>
      <div
        data-state={state}
        className={cn(
          "border-ink inline-flex min-w-[64px] flex-col border-2 px-2 py-1 text-center",
          state === "vacant" ? "bg-warm" : "bg-cream",
        )}
      >
        <span className="font-display text-ink text-[9px] leading-[1.1] font-semibold">
          {node.title}
        </span>
        <span className="text-ink-muted font-mono text-[7px] tracking-[0.04em] uppercase">
          {isRoot ? "de club" : holderLabel(node)}
        </span>
      </div>
      {kids.length > 0 && (
        <ul>
          {kids.map((kid) => (
            <OrgBranch
              key={kid.id}
              node={kid}
              childrenByParent={childrenByParent}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function VolledigOrganigram({
  nodes,
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
          De volledige rapporteringsstructuur in één overzicht — handig om af te
          drukken of als bijlage te delen.
        </p>
        <button
          type="button"
          onClick={handleDownload}
          className="border-ink bg-cream-soft text-ink shadow-paper-sm focus-visible:outline-ink flex shrink-0 items-center gap-2 border-2 px-4 py-2.5 font-mono text-xs font-bold tracking-wide uppercase transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <DownloadSimple size={16} aria-hidden />
          Download als PDF
        </button>
      </div>

      <div ref={chartRef} className="vo-chart overflow-x-auto pb-2">
        {/* `safe center` centres a chart that fits but left-aligns (and stays
            scrollable) when it's wider than the viewport — otherwise flex
            centering pushes the left edge off-screen and out of scroll reach. */}
        <ul className="vo-tree" style={{ justifyContent: "safe center" }}>
          <OrgBranch
            node={root}
            childrenByParent={childrenByParent}
            isRoot={root.id === CLUB_ROOT_ID}
          />
        </ul>
      </div>
    </div>
  );
}
