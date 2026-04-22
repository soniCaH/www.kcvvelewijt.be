/**
 * Spinner Component
 * Loading indicator with KCVV branding
 */

import { forwardRef, type HTMLAttributes } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export type SpinnerSize = "sm" | "md" | "lg" | "xl";
export type SpinnerVariant = "primary" | "secondary" | "white" | "logo";

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Size of the spinner
   * @default 'md'
   */
  size?: SpinnerSize;
  /**
   * Visual variant
   * @default 'primary'
   */
  variant?: SpinnerVariant;
  /**
   * Accessible label for screen readers
   * @default 'Loading...'
   */
  label?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Spinner component for loading states
 *
 * @example
 * ```tsx
 * <Spinner size="lg" variant="primary" />
 *
 * <Spinner label="Loading articles..." />
 *
 * <Spinner variant="logo" /> // KCVV logo spinner
 * ```
 */
export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  (
    {
      size = "md",
      variant = "primary",
      label = "Loading...",
      className,
      ...props
    },
    ref,
  ) => {
    // Logo variant with 3D Y-axis rotation (matches Gatsby site)
    if (variant === "logo") {
      return (
        <div
          ref={ref}
          role="status"
          aria-label={label}
          className={cn("inline-flex items-center justify-center", className)}
          {...props}
        >
          <Image
            src="/images/logo-flat.png"
            alt="KCVV Logo"
            width={
              size === "sm" ? 48 : size === "md" ? 56 : size === "lg" ? 80 : 96
            }
            height={
              size === "sm" ? 48 : size === "md" ? 56 : size === "lg" ? 80 : 96
            }
            className={cn("animate-kcvv-logo-spin", {
              "h-12 w-12": size === "sm",
              "h-14 w-14": size === "md", // 3.5rem to match Gatsby
              "h-20 w-20": size === "lg",
              "h-24 w-24": size === "xl",
            })}
          />
          <span className="sr-only">{label}</span>
        </div>
      );
    }

    // SVG spinner for other variants
    return (
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={cn("inline-flex items-center justify-center", className)}
        {...props}
      >
        <svg
          className={cn(
            "animate-spin",
            // Size classes
            {
              "h-4 w-4": size === "sm",
              "h-8 w-8": size === "md",
              "h-12 w-12": size === "lg",
              "h-16 w-16": size === "xl",
            },
            // Color classes
            {
              "text-kcvv-green-bright": variant === "primary",
              "text-gray-600": variant === "secondary",
              "text-white": variant === "white",
            },
          )}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="sr-only">{label}</span>
      </div>
    );
  },
);

Spinner.displayName = "Spinner";

/**
 * FullPageSpinner for page-level loading states
 */
export interface FullPageSpinnerProps {
  /**
   * Accessible label for screen readers
   * @default 'Loading page...'
   */
  label?: string;
  /**
   * Size of the spinner
   * @default 'xl'
   */
  size?: SpinnerSize;
}

export const FullPageSpinner = ({
  label = "Loading page...",
  size = "xl",
}: FullPageSpinnerProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <Spinner size={size} label={label} />
    </div>
  );
};

FullPageSpinner.displayName = "FullPageSpinner";
