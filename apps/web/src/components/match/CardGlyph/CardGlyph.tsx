import type { CardType } from "@kcvv/api-contract";

/**
 * Card-shape SVG used by both `<MatchLineup>` row badges and the events row
 * glyph cell on `<MatchEventsSection>`. Single source of truth for the
 * Phase 6.B redesign card palette:
 *
 *   - **yellow**         → fill `#f4c430`, ink stroke
 *   - **red**            → fill `var(--color-card-red)` (Phase 6.B.d5), ink stroke
 *   - **double_yellow**  → yellow rect with a red rect offset 6px right
 *                          (matches the legacy lineup-row stacked layout)
 *
 * The intrinsic SVG dimensions are 12×16 (single card) / 18×16 (double).
 * Callers pass `size` to scale uniformly; the SVG keeps its aspect via
 * `preserveAspectRatio`.
 */

export interface CardGlyphProps {
  /** Card type to render. */
  type: CardType;
  /**
   * Width in CSS pixels. Defaults to 12 (intrinsic single-card width).
   * The height scales proportionally — single card is 16/12 of the width,
   * double card is 16/18 of the width.
   */
  size?: number;
  /**
   * Accessible label. Defaults to the canonical Dutch labels used across
   * the match-detail page (`Gele kaart` / `Rode kaart` / `Tweede gele kaart`).
   * Override when context already names the card via a parent element.
   */
  label?: string;
  className?: string;
}

const DEFAULT_LABELS: Record<CardType, string> = {
  yellow: "Gele kaart",
  red: "Rode kaart",
  double_yellow: "Tweede gele kaart",
};

export function CardGlyph({
  type,
  size = 12,
  label,
  className,
}: CardGlyphProps) {
  const ariaLabel = label ?? DEFAULT_LABELS[type];
  const stroke = "var(--color-ink)";

  if (type === "double_yellow") {
    // 18px wide intrinsic — preserve the offset stacking.
    const width = size * 1.5;
    const height = size * (16 / 12);
    return (
      <svg
        viewBox="0 0 18 16"
        width={width}
        height={height}
        aria-label={ariaLabel}
        role="img"
        className={className}
      >
        <rect
          x="1"
          y="1"
          width="10"
          height="14"
          rx="1"
          fill="#f4c430"
          stroke={stroke}
          strokeWidth="1"
        />
        <rect
          x="6"
          y="1"
          width="10"
          height="14"
          rx="1"
          fill="var(--color-card-red)"
          stroke={stroke}
          strokeWidth="1"
        />
      </svg>
    );
  }

  const fill = type === "yellow" ? "#f4c430" : "var(--color-card-red)";
  const height = size * (16 / 12);

  return (
    <svg
      viewBox="0 0 12 16"
      width={size}
      height={height}
      aria-label={ariaLabel}
      role="img"
      className={className}
    >
      <rect
        x="1"
        y="1"
        width="10"
        height="14"
        rx="1"
        fill={fill}
        stroke={stroke}
        strokeWidth="1"
      />
    </svg>
  );
}
