import { Children, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type TapedCardGridColumns = 1 | 2 | 3 | 4;
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

// Per-slot tape rotation — narrower range than card rotation so tapes feel
// hand-placed without dominating the layout. Capped at -6° (owner: -7° too
// much). Cycles 4-wide so tapes vary across each grid row.
const TAPE_ROTATION_POOL = ["-3deg", "-4deg", "-5deg", "-6deg"] as const;

type StyleWithVars = CSSProperties & Record<`--${string}`, string | number>;

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
      className={cn("grid", COLUMNS_CLASS[columns], GAP_CLASS[gap], className)}
    >
      {items.map((child, index) => {
        const slotStyle: StyleWithVars = {
          "--taped-card-rotation": ROTATION_POOL[index % ROTATION_POOL.length]!,
          "--tape-rotation":
            TAPE_ROTATION_POOL[index % TAPE_ROTATION_POOL.length]!,
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
