"use client";

import { useRef, useState } from "react";
import type { OrgChartNode } from "@/types/organigram";
import { cn } from "@/lib/utils/cn";
import { ArrowsOut } from "@/lib/icons.redesign";
import { OrganigramExplorer } from "./OrganigramExplorer";

/**
 * Client launcher for the fullscreen `<OrganigramExplorer>` — the "Open
 * verkenner ⤢" affordance on `/hulp#structuur`. Owns the open/close state and
 * hands the explorer a `returnFocusRef` so focus returns to this button on close.
 */
export interface ExplorerLauncherProps {
  nodes: OrgChartNode[];
  className?: string;
}

export function ExplorerLauncher({ nodes, className }: ExplorerLauncherProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={cn(
          "border-ink bg-jersey-deep text-cream shadow-paper-sm focus-visible:outline-ink inline-flex items-center gap-2 border-2 px-4 py-2.5 font-mono text-xs font-bold tracking-wide uppercase transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2",
          className,
        )}
      >
        <ArrowsOut size={16} aria-hidden />
        Open verkenner ⤢
      </button>

      <OrganigramExplorer
        nodes={nodes}
        open={open}
        onClose={() => setOpen(false)}
        returnFocusRef={buttonRef}
      />
    </>
  );
}
