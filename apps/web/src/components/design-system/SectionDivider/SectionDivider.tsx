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
  /**
   * Mirrors the diagonal horizontally.
   *
   * Default (flip=false): diagonal runs ↙ for top, ↗ for bottom.
   *   - top: fills upper-LEFT triangle  → use on MatchWidget top
   *   - bottom: fills lower-RIGHT triangle → use on MatchWidget bottom
   *
   * flip=true: diagonal runs ↘ for both.
   *   - top: fills upper-RIGHT triangle → use on LatestNews top
   *   - bottom: fills lower-LEFT triangle → use on FeaturedArticles bottom
   */
  flip?: boolean;
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
 * The divider height scales proportionally with viewport width (`6vw`, capped at 5rem)
 * so the diagonal angle stays consistent at ~3.5° across all screen sizes.
 *
 * @example
 * ```tsx
 * // FeaturedArticles (dark) → MatchWidget (green): white band on left side
 * <SectionDivider color="white" position="bottom" flip />  // in FeaturedArticles
 * <SectionDivider color="white" position="top" />          // in MatchWidget
 *
 * // MatchWidget (green) → LatestNews (gray-100):
 * <SectionDivider color="gray-100" position="bottom" />    // in MatchWidget
 * ```
 */
export function SectionDivider({
  color,
  position,
  flip = false,
  className,
}: SectionDividerProps) {
  const clipPath = flip
    ? position === "top"
      ? "polygon(0 0, 100% 0, 100% 100%)" // upper-right ↘
      : "polygon(0 0, 0 100%, 100% 100%)" // lower-left ↘
    : position === "top"
      ? "polygon(0 0, 100% 0, 0 100%)" // upper-left ↙
      : "polygon(0 100%, 100% 100%, 100% 0%)"; // lower-right ↗

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
