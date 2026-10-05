import { Children, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type TapedCardGridColumns = 1 | 2 | 3 | 4;

/**
 * Gutter width. **The gutter follows the card, not the route** (#2569 /
 * decision #2431):
 *
 * - `sm` — a door into a section (`<EditorialHubCard>`): no tape, so the cards
 *   sit dense.
 * - `md` — a dated artefact (`<NewsCard>`, `<GalleryCard>`): a `TapeStrip` sits
 *   at `top-0` with `translateY(-50%)` and overhangs the card edge, so the card
 *   needs air.
 * - `lg` — reserved for grids of full editorial blocks.
 */
export type TapedCardGridGap = "sm" | "md" | "lg";

export type TapedCardGridAs = "div" | "ol" | "ul";

export interface TapedCardGridProps {
  columns?: TapedCardGridColumns;
  gap?: TapedCardGridGap;
  as?: TapedCardGridAs;
  emptyState?: ReactNode;
  className?: string;
  children?: ReactNode;
}

const COLUMNS_CLASS: Record<TapedCardGridColumns, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

const GAP_CLASS: Record<TapedCardGridGap, string> = {
  // Tight on one column; once cards sit side by side their lean and offset
  // shadow need air, or neighbours nearly touch (club + jeugd hubs).
  sm: "gap-3 sm:gap-6 lg:gap-8",
  md: "gap-6",
  lg: "gap-10",
};

// The slot's lean — the site's slight tier (`--rotate-lean-*`, #3329).
const ROTATION_POOL = [
  "var(--rotate-lean-a)",
  "var(--rotate-lean-b)",
  "var(--rotate-lean-c)",
  "var(--rotate-lean-d)",
] as const;

// Per-slot tape horizontal inset. Range: a few percent in (4%) up to the
// standalone default (12%). Same idea as rotation — tapes in the same row
// don't perfectly align horizontally.
const TAPE_LEFT_POOL = ["4%", "7%", "10%", "12%"] as const;

type StyleWithVars = CSSProperties & Record<`--${string}`, string | number>;

/**
 * The shared card grid. Every card grid on the site is one of these — a
 * hand-rolled `grid-cols-*` ladder beside a card is the drift this primitive
 * exists to remove (#2569 / decision #2431).
 *
 * **The slot contract.** Each child is wrapped in a slot element carrying two
 * CSS variables, and a child opts in by reading them:
 *
 * - `--taped-card-rotation` — the card's own angle. `<TapedCard rotation="auto">`
 *   reads it (so `<NewsCard>` does, by default); a card that is not a
 *   `<TapedCard>` reads it directly, as `<EditorialHubCard>` does with
 *   `rotate-[var(--taped-card-rotation,0deg)]`.
 * - `--tape-left` — the tape strip's inset (placement, so the slot owns it).
 *   The tape's *angle* is not the slot's: it follows the card's identity
 *   (`<TapeStrip seed>`, #3302 / #3329), so the same card wears the same tape
 *   on every page.
 *
 * Every variable falls back to a flat, centred default, so a card outside a
 * grid renders exactly as it did before.
 */
export function TapedCardGrid({
  columns = 3,
  gap = "md",
  as: Tag = "div",
  emptyState,
  className,
  children,
}: TapedCardGridProps) {
  const items = Children.toArray(children);

  if (items.length === 0) {
    if (emptyState === undefined) return null;
    return <>{emptyState}</>;
  }

  const SlotTag = Tag === "ol" || Tag === "ul" ? "li" : "div";

  return (
    <Tag
      data-columns={columns}
      data-gap={gap}
      // Tailwind Preflight's reset (`ol, ul { list-style: none; }`,
      // globals.css) drops the implicit ARIA "list" role from a `<ul>`/
      // `<ol>` in modern browser accessibility trees — a `list-style: none`
      // list is no longer exposed as a list at all — orphaning the `<li>`
      // slots' implicit "listitem" role from any list-roled ancestor
      // (#3188 — axe `listitem`). The actual violation this fix landed for
      // was a story rendering its own `as="li"` children a SECOND time
      // inside the grid's own `<li>` slot (nested `<li>`s, fixed in
      // TapedCardGrid.stories.tsx) — this `role="list"` closes the same
      // underlying gap so the grid's OWN slot markup stays correct
      // regardless. Restore the role explicitly whenever the slot is a
      // real `<li>`; the `div` path has no `<li>` children, so nothing to
      // fix.
      role={SlotTag === "li" ? "list" : undefined}
      className={cn("grid", COLUMNS_CLASS[columns], GAP_CLASS[gap], className)}
    >
      {items.map((child, index) => {
        const slotStyle: StyleWithVars = {
          "--taped-card-rotation": ROTATION_POOL[index % ROTATION_POOL.length]!,
          "--tape-left": TAPE_LEFT_POOL[index % TAPE_LEFT_POOL.length]!,
        };
        return (
          <SlotTag
            key={index}
            data-slot={index}
            style={slotStyle}
            className={SlotTag === "li" ? "list-none" : undefined}
          >
            {child}
          </SlotTag>
        );
      })}
    </Tag>
  );
}
