"use client";

/**
 * Button Component
 * Reusable button with KCVV design system variants
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { ArrowRight } from "@/lib/icons";
import { getButtonClasses } from "./button-styles";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual variant of the button
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * Size of the button
   * @default 'md'
   */
  size?: ButtonSize;
  /**
   * Show arrow icon on the right (animates on hover)
   * @default false
   */
  withArrow?: boolean;
  /**
   * Make button full width
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Button content
   */
  children: ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Button component with KCVV design system variants
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md">
 *   Click me
 * </Button>
 *
 * <Button variant="secondary" withArrow>
 *   Learn more
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      withArrow = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={getButtonClasses({
          variant,
          size,
          fullWidth,
          disabled,
          className,
        })}
        {...props}
      >
        {children}

        {withArrow && (
          <ArrowRight
            size={16}
            className={cn(
              "transition-transform duration-300",
              "group-hover:translate-x-1",
            )}
            aria-hidden="true"
          />
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
