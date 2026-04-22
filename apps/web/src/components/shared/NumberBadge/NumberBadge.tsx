/**
 * NumberBadge Component
 *
 * 3D decorative badge displaying numbers or short text codes.
 * Used for jersey numbers (PlayerCard), role codes (staff), and age groups (TeamCard).
 *
 * Features:
 * - 3D text-shadow effect with layered shadows
 * - Stenciletta font for numbers (stencil look)
 * - Color variants: green (players), navy (staff), blue (youth)
 * - Size variants for different card contexts
 * - Hover scale animation
 */

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { BADGE_SHADOWS } from "@/lib/utils/text-shadow";
import {
  CARD_COLORS,
  type BadgeColor,
  type BadgeSize,
} from "@/lib/utils/card-tokens";

export interface NumberBadgeProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** Value to display (number or short text like "T1", "U15") */
  value: string | number;
  /** Color variant */
  color?: BadgeColor;
  /** Size variant */
  size?: BadgeSize;
  /** Enable hover animation */
  animated?: boolean;
}

export const NumberBadge = forwardRef<HTMLDivElement, NumberBadgeProps>(
  (
    {
      value,
      color = "green",
      size = "lg",
      animated = true,
      className,
      ...props
    },
    ref,
  ) => {
    const badgeColor = CARD_COLORS.badge[color];
    const textShadow = BADGE_SHADOWS[color][size];

    // Determine if value is short text (like role codes) vs number
    const isText = typeof value === "string" && isNaN(Number(value));

    // Text codes (like TVJO) need smaller sizes to fit 4 characters
    const fontSizeClasses = isText
      ? // Text codes: smaller sizes for 4 character codes
        {
          sm: "text-[3rem] lg:text-[4rem]",
          md: "text-[4rem] lg:text-[5rem]",
          lg: "text-[5rem] lg:text-[6rem] xl:text-[7rem]",
        }
      : // Numbers: original larger sizes
        {
          sm: "text-[5rem] lg:text-[7rem]",
          md: "text-[7rem] lg:text-[9rem]",
          lg: "text-[8rem] lg:text-[11.25rem] xl:text-[14rem]",
        };

    return (
      <div
        ref={ref}
        className={cn(
          "number-badge",
          "pointer-events-none absolute z-[5]",
          "transition-all duration-300 ease-in-out",
          animated && "group-hover:origin-top-left group-hover:scale-110",
          // Size-specific positioning (lg matches left/top margins for player cards)
          size === "sm" && "top-[8px] left-[12px]",
          size === "md" && "top-[10px] left-[12px]",
          size === "lg" && "top-[15px] left-[15px]",
          // Font size (different for text vs numbers)
          fontSizeClasses[size],
          className,
        )}
        style={{
          fontFamily: "stenciletta, sans-serif",
          lineHeight: 0.71,
          letterSpacing: isText ? "-2px" : "-6px",
          whiteSpace: "nowrap",
          color: badgeColor,
          WebkitTextStroke: `${isText ? "2px" : "4px"} ${badgeColor}`,
          WebkitTextFillColor: "white",
          textShadow,
        }}
        aria-hidden="true"
        {...props}
      >
        {value}
      </div>
    );
  },
);

NumberBadge.displayName = "NumberBadge";
