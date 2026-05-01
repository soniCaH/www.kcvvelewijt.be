"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { getButtonClasses } from "./button-styles";

export type ButtonVariant = "primary" | "inverted" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  withArrow?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
}

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
          <span
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
