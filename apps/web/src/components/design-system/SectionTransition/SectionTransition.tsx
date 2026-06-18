import {
  StripedSeam,
  STRIPED_SEAM_HEIGHT_PX,
  type StripedSeamColorPair,
  type StripedSeamDirection,
  type StripedSeamHeight,
} from "@/components/design-system/StripedSeam";
import { cn } from "@/lib/utils/cn";

/**
 * Section background tokens. Shared with `<SectionStack>` via `BG_CLASS`.
 * The legacy diagonal `<SectionTransition>` variants (and their `kcvv-black`
 * / `kcvv-green-dark` SVG-fill palette) were retired in #2154 — every section
 * transition is now a `<StripedSeam>`.
 */
export type SectionBg = "white" | "gray-100" | "jersey-deep" | "transparent";

export type SectionTransitionConfig = {
  type: "striped-seam";
  height: StripedSeamHeight;
  colorPair: StripedSeamColorPair;
  /** Defaults to `"horizontal"` — vertical is reserved for column seams. */
  direction?: StripedSeamDirection;
};

// Tailwind background class for each section surface — shared by `SectionStack`
// so new `SectionBg` values only need to be added here.
export const BG_CLASS: Record<SectionBg, string> = {
  white: "bg-white",
  "gray-100": "bg-gray-100",
  "jersey-deep": "bg-jersey-deep",
  transparent: "bg-transparent",
};

export interface SectionTransitionProps {
  /** Always `"striped-seam"` — kept for prop-shape parity with the config spread. */
  type?: "striped-seam";
  /** `"horizontal" | "vertical"` seam orientation. Defaults to horizontal. */
  direction?: StripedSeamDirection;
  /** Forwarded to `<StripedSeam>`. */
  height?: StripedSeamHeight;
  /** Forwarded to `<StripedSeam>`. */
  colorPair?: StripedSeamColorPair;
  className?: string;
}

/**
 * Resolve the seam's vertical bleed distance to a CSS length so
 * `<SectionStack>` can extend a neighbour-section's backdrop into the
 * transition strip by the right amount.
 */
export function getTransitionBleed(config: SectionTransitionConfig): string {
  return `${STRIPED_SEAM_HEIGHT_PX[config.height]}px`;
}

export function SectionTransition({
  direction,
  height,
  colorPair,
  className,
}: SectionTransitionProps) {
  // Equality narrow rather than a cast so a stray value can't slip through.
  const seamDirection: StripedSeamDirection =
    direction === "vertical" ? "vertical" : "horizontal";
  const isVertical = seamDirection === "vertical";
  return (
    <div
      aria-hidden="true"
      data-testid="section-transition"
      data-type="striped-seam"
      className={cn(
        "pointer-events-none relative",
        // Sub-pixel pull: a horizontal seam stretches across the row and pulls
        // 1px into the next section to swallow sub-pixel gaps; a vertical seam
        // stretches down the column instead.
        isVertical ? "-mr-px h-full" : "-mb-px w-full",
        className,
      )}
    >
      <StripedSeam
        height={height ?? "md"}
        colorPair={colorPair ?? "ink-cream"}
        direction={seamDirection}
      />
    </div>
  );
}
