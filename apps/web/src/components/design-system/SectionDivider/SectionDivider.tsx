import { cn } from "@/lib/utils/cn";

export type SectionDividerColor =
  | "white"
  | "gray-100"
  | "kcvv-black"
  | "kcvv-green-dark";

export type SectionDividerPosition = "top" | "bottom";

export interface SectionDividerProps {
  /**
   * Background colour of the adjacent section this divider reveals.
   * Must match the bg colour of the section above (position=top)
   * or below (position=bottom).
   */
  color: SectionDividerColor;
  /** Whether the cut sits at the top or bottom of its parent section */
  position: SectionDividerPosition;
  className?: string;
}

const colorClass: Record<SectionDividerColor, string> = {
  white: "bg-white",
  "gray-100": "bg-gray-100",
  "kcvv-black": "bg-kcvv-black",
  "kcvv-green-dark": "bg-kcvv-green-dark",
};

/**
 * Full-width diagonal section divider.
 *
 * Place inside a `relative overflow-hidden` parent section.
 * The divider renders an 80px-tall absolutely-positioned triangle
 * that visually "cuts" the section boundary at a consistent angle
 * (~3.6° at 1280px, ~12° on 375px mobile).
 *
 * @example
 * ```tsx
 * // At the bottom of FeaturedArticles (bg-kcvv-black) above MatchWidget (bg-kcvv-green-dark):
 * <SectionDivider color="kcvv-green-dark" position="bottom" />
 * ```
 */
export function SectionDivider({
  color,
  position,
  className,
}: SectionDividerProps) {
  const clipPath =
    position === "top"
      ? "polygon(0 0, 100% 0, 100% 0%, 0 100%)"
      : "polygon(0 100%, 100% 100%, 100% 0%, 0 100%)";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute inset-x-0 h-20 z-10",
        position === "top" ? "top-0" : "bottom-0",
        colorClass[color],
        className,
      )}
      style={{ clipPath }}
    />
  );
}
