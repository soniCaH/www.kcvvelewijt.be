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
 * The divider height scales proportionally with viewport width (`6vw`, capped at 80px)
 * so the diagonal angle stays consistent at ~3.5° across all screen sizes.
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
        "absolute inset-x-0 z-10",
        position === "top" ? "top-0" : "bottom-0",
        colorClass[color],
        className,
      )}
      style={{ clipPath, height: "clamp(2rem, 6vw, 5rem)" }}
    />
  );
}
