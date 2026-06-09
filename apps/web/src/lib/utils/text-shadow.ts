/**
 * Text Shadow Utilities
 *
 * Generates 3D text-shadow effects for decorative badge numbers.
 * Used by PlayerCard (green) and TeamCard (blue).
 */

import { CARD_COLORS, type BadgeColor } from "./card-tokens";

/**
 * Generate a multi-layer text-shadow CSS value to create a 3D offset effect.
 *
 * @param precision - Pixel increment between successive shadow offsets (smaller = smoother)
 * @param size - Reference size determining total shadow depth (larger = deeper shadow)
 * @param color - Hex color for the shadow layers
 * @returns A comma-separated text-shadow CSS string
 *
 * @example
 * ```ts
 * generateTextShadow(0.25, 8, "#4B9B48")
 * // Returns: "-0.25px 0.25px #4B9B48, -0.5px 0.5px #4B9B48, ..."
 * ```
 */
export function generateTextShadow(
  precision: number,
  size: number,
  color: string,
): string {
  const shadows: string[] = [];
  let offset = 0;
  const length = Math.floor(size * (1 / precision)) - 1;

  for (let i = 0; i <= length; i++) {
    offset += precision;
    shadows.push(`${-offset}px ${offset}px ${color}`);
  }

  return shadows.join(", ");
}

/**
 * Retrieve the precomputed text-shadow CSS string for a badge color and size preset.
 *
 * @param color - The badge color variant
 * @param size - Size preset: "sm" (6), "md" (7), "lg" (8)
 * @returns The text-shadow CSS value for the specified badge color and size
 */
export function getBadgeTextShadow(
  color: BadgeColor,
  size: "sm" | "md" | "lg" = "lg",
): string {
  return BADGE_SHADOWS[color][size];
}

// Pre-calculated shadows for performance (most common use cases)
export const BADGE_SHADOWS = {
  green: {
    sm: generateTextShadow(0.25, 6, CARD_COLORS.badge.green),
    md: generateTextShadow(0.25, 7, CARD_COLORS.badge.green),
    lg: generateTextShadow(0.25, 8, CARD_COLORS.badge.green),
  },
  navy: {
    sm: generateTextShadow(0.25, 6, CARD_COLORS.badge.navy),
    md: generateTextShadow(0.25, 7, CARD_COLORS.badge.navy),
    lg: generateTextShadow(0.25, 8, CARD_COLORS.badge.navy),
  },
  blue: {
    sm: generateTextShadow(0.25, 6, CARD_COLORS.badge.blue),
    md: generateTextShadow(0.25, 7, CARD_COLORS.badge.blue),
    lg: generateTextShadow(0.25, 8, CARD_COLORS.badge.blue),
  },
} as const;
