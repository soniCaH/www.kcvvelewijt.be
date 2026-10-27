"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import type { OrgChartNode } from "@/types/organigram";
import { cn } from "@/lib/utils/cn";
import { PRESS_DOWN_CLASSES } from "@/components/design-system";
import { deriveCardState } from "./card-state";
import { ArrowsOut } from "@/lib/icons.redesign";
import { ScrollOverlay } from "@/components/design-system/ScrollHint/ScrollOverlay";
import { holderLabel } from "./SpotlightNodeCard";
import {
  buildSpotlightTree,
  childrenOf,
  CLUB_ROOT_ID,
  withClubRoot,
} from "./spotlight-tree";

/**
 * `<VolledigOrganigram>` — the full reporting tree as a pure-CSS DOM box chart
 * (no canvas, no library). Two jobs in one component (competitive analysis 7o3b
 * §5): it is the **accessible fallback** to the spotlight (a real nested
 * list/tree, keyboard- and screen-reader-navigable). It is not printed: the
 * PDF is the clubboek's list (#3525), not this tree, which cannot be read at
 * any scale that fits a sheet.
 */

export interface VolledigOrganigramProps {
  nodes: OrgChartNode[];
  /** When provided, each node box becomes a button that drills into the explorer. */
  onNodeClick?: (id: string, trigger: HTMLElement) => void;
  /** When provided, renders a "Blader door het organigram ⤢" button in the toolbar. */
  onOpenExplorer?: (trigger: HTMLElement) => void;
  className?: string;
}

function OrgBranch({
  node,
  childrenByParent,
  onNodeClick,
  isRoot = false,
  rootRef,
}: {
  node: OrgChartNode;
  childrenByParent: (id: string) => OrgChartNode[];
  onNodeClick?: (id: string, trigger: HTMLElement) => void;
  isRoot?: boolean;
  rootRef?: React.RefObject<HTMLLIElement | null>;
}) {
  const kids = childrenByParent(node.id);
  const state = isRoot ? "root" : deriveCardState(node.members.length);
  const boxClass = cn(
    "border-ink inline-flex min-w-[64px] flex-col border-2 px-2 py-1 text-center",
    state === "vacant" ? "bg-warm" : "bg-cream",
    onNodeClick && `cursor-pointer ${PRESS_DOWN_CLASSES}`,
  );
  // Deliberately below the 11px Label floor: this is a node-link
  // diagram, not page chrome, and the type size is what makes the tree fit.
  // Measured at 11px: every holder label wraps to two lines, nodes inflate,
  // and the right-hand branch is pushed off-canvas. Raising these is a layout
  // change (zoom control or scrollable canvas), not a typography change.
  const content = (
    <>
      <span className="font-display text-ink text-[9px] leading-[1.1] font-semibold">
        {node.title}
      </span>{" "}
      <span className="text-ink-muted font-mono text-[7px] tracking-[0.04em] uppercase">
        {isRoot ? "de club" : holderLabel(node)}
      </span>
    </>
  );

  return (
    <li ref={rootRef}>
      {onNodeClick ? (
        <button
          type="button"
          data-state={state}
          onClick={(e) => onNodeClick(node.id, e.currentTarget)}
          className={boxClass}
        >
          {/* Named by its visible content, not an `aria-label`, so the name
              holds every visible word (#3690). */}
          <span className="sr-only">Open </span>
          {content}
          <span className="sr-only"> in de verkenner</span>
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
  const tree = useMemo(() => buildSpotlightTree(withClubRoot(nodes)), [nodes]);
  const childrenByParent = (id: string) => childrenOf(tree, id);
  const root = tree.byId.get(CLUB_ROOT_ID);

  // The chart is wider than most viewports and the track opens at scrollLeft 0,
  // which is the far left of the tree — not the root. Keep the root centred
  // while the layout settles (a late font swap, a resize or a rotation), and
  // stop at the first scroll the visitor makes themselves.
  const rootRef = useRef<HTMLLIElement>(null);
  // Before paint, so the chart never shows its far-left start first.
  useLayoutEffect(() => {
    const rootBranch = rootRef.current;
    const track = rootBranch?.closest<HTMLElement>(".vo-chart");
    if (!rootBranch || !track) return;

    let visitorScrolled = false;
    let centredAt = Number.NaN;
    const centre = () => {
      if (visitorScrolled) return;
      const trackBox = track.getBoundingClientRect();
      const rootBox = rootBranch.getBoundingClientRect();
      // `instant`: the site's smooth-scroll default would animate this jump.
      track.scrollTo({
        left:
          track.scrollLeft +
          rootBox.left +
          rootBox.width / 2 -
          (trackBox.left + trackBox.width / 2),
        behavior: "instant",
      });
      // What the browser settled on (it clamps), so our own scroll event is
      // told apart from the visitor's.
      centredAt = track.scrollLeft;
    };
    const stop = () => {
      visitorScrolled = true;
    };
    // The track's arrows scroll it too, without a pointer event on the track.
    const onScroll = () => {
      if (Math.abs(track.scrollLeft - centredAt) > 2) stop();
    };

    centre();
    const events = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    for (const type of events)
      track.addEventListener(type, stop, { passive: true });
    track.addEventListener("scroll", onScroll, { passive: true });
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(centre);
    observer?.observe(track);
    observer?.observe(rootBranch);
    return () => {
      for (const type of events) track.removeEventListener(type, stop);
      track.removeEventListener("scroll", onScroll);
      observer?.disconnect();
    };
  }, []);

  if (!root) return null;

  return (
    <div data-testid="volledig-organigram" className={className}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Exempt from the reading-measure ban (DESIGN.md "The
            Reading-Measure Exemption Rule", #2645): this caption shares its
            row with the button group via `justify-between` above, so it is
            toolbar chrome, not a reading column. Converting it to
            `var(--container-prose)` was tried and reverted (#2560 / PR
            #2644) — at 680 the caption claims the whole row, the button
            group wraps to a second line, and the chart shifts down. */}
        <p className="text-ink max-w-[60ch] text-sm leading-relaxed">
          De volledige rapporteringsstructuur in één overzicht. Klik een functie
          om ze in de verkenner te openen.
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {onOpenExplorer && (
            <button
              type="button"
              onClick={(e) => onOpenExplorer(e.currentTarget)}
              aria-haspopup="dialog"
              className={`border-ink bg-jersey-deep text-cream shadow-paper-sm flex items-center gap-2 border-2 px-4 py-2.5 font-mono text-xs font-bold tracking-wide uppercase ${PRESS_DOWN_CLASSES}`}
            >
              <ArrowsOut size={16} aria-hidden />
              Blader door het organigram ⤢
            </button>
          )}
        </div>
      </div>

      {/* Scroll arrow — `<ScrollOverlay>`'s "content scrolled past" idiom
          (#2444, as amended by #2476): the chart is a diagram, not a row of
          tap targets, so it mounts only on real overflow and never holds a
          gutter. */}
      <ScrollOverlay
        direction="both"
        ariaLabel="Volledig organigram"
        trackClassName="vo-chart pb-2"
      >
        {/* `safe center` centres a chart that fits but left-aligns (and
            stays scrollable) when it's wider than the viewport — otherwise
            flex centering pushes the left edge off-screen and out of
            scroll reach. */}
        <ul className="vo-tree" style={{ justifyContent: "safe center" }}>
          <OrgBranch
            node={root}
            childrenByParent={childrenByParent}
            {...(onNodeClick ? { onNodeClick } : {})}
            isRoot={root.id === CLUB_ROOT_ID}
            rootRef={rootRef}
          />
        </ul>
      </ScrollOverlay>
    </div>
  );
}
