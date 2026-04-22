"use client";

/**
 * Icon Component
 * Wrapper for Lucide React icons with consistent sizing and styling
 */

import { forwardRef, type HTMLAttributes } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type IconColor =
  | "current"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "muted";

export interface IconProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children"
> {
  /**
   * Lucide React icon component
   */
  icon: LucideIcon;
  /**
   * Size of the icon
   * @default 'md'
   */
  size?: IconSize;
  /**
   * Color of the icon
   * @default 'current'
   */
  color?: IconColor;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const sizeMap: Record<IconSize, number> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
  "2xl": 48,
};

const colorMap: Record<IconColor, string> = {
  current: "currentColor",
  primary: "var(--color-kcvv-green-bright)",
  secondary: "var(--color-kcvv-gray)",
  success: "var(--color-kcvv-success)",
  warning: "var(--color-kcvv-warning)",
  error: "var(--color-kcvv-alert)",
  muted: "var(--color-gray--medium)",
};

/**
 * Icon component with consistent sizing and KCVV color palette
 *
 * @example
 * ```tsx
 * import { Trophy } from 'lucide-react'
 * // or import { Trophy } from '@/lib/icons'
 *
 * <Icon icon={Trophy} size="lg" color="primary" />
 * ```
 */
export const Icon = forwardRef<HTMLSpanElement, IconProps>(
  (
    {
      icon: IconComponent,
      size = "md",
      color = "current",
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex shrink-0 items-center justify-center",
          className,
        )}
        {...props}
      >
        <IconComponent
          size={sizeMap[size]}
          color={colorMap[color]}
          strokeWidth={2}
          absoluteStrokeWidth={false}
        />
      </span>
    );
  },
);

Icon.displayName = "Icon";
