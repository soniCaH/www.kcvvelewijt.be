"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { LinkPendingDots } from "@/components/design-system/LinkPendingDots";
import { cn } from "@/lib/utils/cn";
import { handleSamePageAnchorClick } from "@/lib/utils/same-page-anchor";

export interface NavTakeoverItemProps {
  label: string;
  href: string;
  active?: boolean;
  onNavigate?: () => void;
  /**
   * Position in the menu, top to bottom — the rule under this row starts
   * drawing `index × --rule-step` after the menu opens (`<NavTakeover>` sets
   * the step from its `rowCount`). Omitted, the rule draws with the first row.
   */
  index?: number;
}

/**
 * The row's hairline is a transparent `border-b` (it keeps the row height and
 * the 1px it has always taken) with the visible rule painted into that border
 * strip by `::after`, so it can scale (#3392, decided in #2498).
 *
 * Draw = `scaleX(0)` → `scaleX(1)` from the left at Arrival speed. `scale-x-*`
 * sets the CSS `scale` property, so the transition names `scale` — `transform`
 * would snap it. Only the rule animates: the start state is `starting:`
 * (`@starting-style`, which fires every time the panel leaves `hidden`), so
 * closing leaves the rules alone, and the row's text and pointer handling are
 * never touched. Keep these literal: Tailwind's scanner has to see them.
 */
const ROW =
  "relative flex w-full items-center justify-between border-b border-transparent py-4 text-left font-display text-display-md italic font-bold transition-colors " +
  "after:bg-paper-edge after:absolute after:inset-x-0 after:-bottom-px after:h-px after:origin-left after:scale-x-100 after:starting:scale-x-0 " +
  "after:transition-[scale] after:duration-500 after:ease-out after:delay-[calc(var(--rule-index,0)*var(--rule-step,30ms))] motion-reduce:after:transition-none";

/**
 * One row of the mobile nav takeover. Every row is a leaf link — the nav lost
 * its submenus with #2415, so there is no expandable variant.
 */
export function NavTakeoverItem({
  label,
  href,
  active,
  onNavigate,
  index = 0,
}: NavTakeoverItemProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      style={{ "--rule-index": index } as CSSProperties}
      onClick={(e) => {
        handleSamePageAnchorClick(e, href);
        onNavigate?.();
      }}
      className={cn(
        ROW,
        active ? "text-jersey-deep" : "text-ink hover:text-jersey-deep",
        "no-underline",
      )}
    >
      <span>{label}</span>
      <LinkPendingDots spaced={false} />
    </Link>
  );
}
