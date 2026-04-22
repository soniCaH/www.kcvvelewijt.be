"use client";

/**
 * Badge Component
 * Compact label for status, categories, and type indicators
 */

import { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "alert"
  | "outline"
  | "live";

export type BadgeSize = "sm" | "md";

export interface BadgeProps {
  /**
   * Visual variant
   * @default 'default'
   */
  variant?: BadgeVariant;
  /**
   * Size variant
   * @default 'md'
   */
  size?: BadgeSize;
  /**
   * Show a pulsing dot indicator (auto-enabled for 'live' variant)
   * @default false
   */
  dot?: boolean;
  /**
   * Badge content
   */
  children: ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Badge component for status labels, categories, and type indicators.
 *
 * @example
 * ```tsx
 * <Badge variant="primary">Nieuws</Badge>
 * <Badge variant="live" dot>Live</Badge>
 * <Badge variant="warning">Uitgesteld</Badge>
 * ```
 */
export function Badge({
  variant = "default",
  size = "md",
  dot,
  children,
  className,
}: BadgeProps) {
  const sizeClasses: Record<BadgeSize, string> = {
    sm: "px-1.5 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
  };

  const dotSize: Record<BadgeSize, string> = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
  };

  const variantClasses: Record<BadgeVariant, string> = {
    // Neutral grey — type labels, generic tags
    default: "bg-foundation-gray-light text-kcvv-gray",

    // Green — primary category, active state
    primary: "bg-kcvv-green-bright/15 text-kcvv-green-dark",

    // Semantic: success
    success: "bg-kcvv-success/15 text-kcvv-green-dark",

    // Semantic: warning (orange-ish)
    warning: "bg-kcvv-warning/20 text-amber-800",

    // Semantic: error / alert
    alert: "bg-kcvv-alert/10 text-kcvv-alert",

    // Ghost with green border
    outline:
      "bg-transparent border border-kcvv-green-bright text-kcvv-green-bright",

    // Special: live match — red pulsing
    live: "bg-red-500 text-white",
  };

  const showDot = dot || variant === "live";

  const dotColorClass = variant === "live" ? "bg-white" : "bg-current";

  return (
    <span
      className={cn(
        "font-body inline-flex items-center rounded font-medium",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
    >
      {showDot && (
        <span
          className={cn(
            "shrink-0 rounded-full",
            dotSize[size],
            dotColorClass,
            variant === "live" && "animate-pulse",
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
