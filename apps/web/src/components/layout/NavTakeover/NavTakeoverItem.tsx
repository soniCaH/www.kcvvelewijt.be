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
   * drawing `index × step` after the menu opens, the step being
   * `min(30ms, 270ms / (rows − 1))` from the `--rule-count` that
   * `<NavTakeover rowCount>` sets. Omitted, the rule draws with the first row.
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
 * (`@starting-style`, which fires when the panel comes back from
 * `display: none` — so re-opening after the close fade has finished replays
 * the draw, while a re-open inside that 150ms fade finds the rules still drawn
 * and replays nothing). Closing leaves the rules alone, and the row's text and
 * pointer handling are never touched.
 *
 * The delay is CSS only: `index × min(30ms, 270ms / (rows − 1))`, so the last
 * rule never starts after 270ms however many rows the menu has (#2498: a bigger
 * menu shrinks the step, never the cap). Spaces are `_` and `rows − 1` is
 * floored at 1 so a one-row menu does not divide by zero. Keep the classes
 * literal: Tailwind's scanner has to see them.
 */
const ROW =
  "relative flex w-full items-center justify-between border-b border-transparent py-4 text-left font-display text-display-md italic font-bold transition-colors " +
  "after:bg-paper-edge after:absolute after:inset-x-0 after:-bottom-px after:h-px after:origin-left after:scale-x-100 after:starting:scale-x-0 " +
  "after:transition-[scale] after:duration-500 after:ease-out after:delay-[calc(var(--rule-index,0)*min(30ms,270ms/max(var(--rule-count,1)_-_1,1)))] motion-reduce:after:transition-none";

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
