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
  sm: "gap-3",
  md: "gap-6",
  lg: "gap-10",
};

const ROTATION_POOL = [
  "var(--rotate-tape-a)",
  "var(--rotate-tape-b)",
  "var(--rotate-tape-c)",
  "var(--rotate-tape-d)",
] as const;

// Per-slot tape rotation — full range -1° to -6° per owner (-7° too much,
// -1° to -6° gives wider hand-placed feel across a row). 6-wide cycle so
// each card in a 6-card row gets a unique tape angle.
const TAPE_ROTATION_POOL = [
  "-1deg",
  "-2deg",
  "-3deg",
  "-4deg",
  "-5deg",
  "-6deg",
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
 * **The slot contract.** Each child is wrapped in a slot element carrying three
 * CSS variables, and a child opts in by reading them:
 *
 * - `--taped-card-rotation` — the card's own angle. `<TapedCard rotation="auto">`
 *   reads it (so `<NewsCard>` does, by default); a card that is not a
 *   `<TapedCard>` reads it directly, as `<EditorialHubCard>` does with
 *   `rotate-[var(--taped-card-rotation,0deg)]`.
 * - `--tape-rotation` / `--tape-left` — the tape strip's angle and inset,
 *   read by `<TapeStrip>` unless the card passes its own pick.
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
      // `display: grid` on a `<ul>`/`<ol>` drops its implicit ARIA "list"
      // role in Chromium's accessibility tree, orphaning the `<li>` slots'
      // implicit "listitem" role from any list-roled ancestor (#3188 — axe
      // `listitem`). Restore the role explicitly whenever the slot is a real
      // `<li>`; the `div` path has no `<li>` children, so nothing to fix.
      role={SlotTag === "li" ? "list" : undefined}
      className={cn("grid", COLUMNS_CLASS[columns], GAP_CLASS[gap], className)}
    >
      {items.map((child, index) => {
        const slotStyle: StyleWithVars = {
          "--taped-card-rotation": ROTATION_POOL[index % ROTATION_POOL.length]!,
          "--tape-rotation":
            TAPE_ROTATION_POOL[index % TAPE_ROTATION_POOL.length]!,
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
