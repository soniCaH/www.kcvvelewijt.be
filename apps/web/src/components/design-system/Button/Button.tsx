"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "../Spinner";
import { getButtonClasses } from "./button-styles";

export type ButtonVariant = "primary" | "inverted" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  withArrow?: boolean;
  fullWidth?: boolean;
  /**
   * A request this button started is in flight (Waiting-Device Rule,
   * DESIGN.md → Motion). The label and arrow stay in flow, hidden, so the
   * button keeps its width; the compact dots sit on top, and the button is
   * disabled. The button's accessible name becomes `loadingLabel`. Announce
   * the wait from a live region outside the button — a button's children are
   * presentational, so a `role="status"` inside it is never spoken.
   * @default false
   */
  loading?: boolean;
  /**
   * Accessible name while `loading`, e.g. `"Versturen…"`.
   * @default "Laden…"
   */
  loadingLabel?: string;
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
      loading = false,
      loadingLabel = "Laden…",
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={getButtonClasses({
          variant,
          size,
          fullWidth,
          disabled: isDisabled,
          className: cn(loading && "relative", className),
        })}
        {...props}
      >
        {loading ? (
          <>
            {/* aria-hidden: no stylesheet means no `visibility`, so the name
                must not depend on it — the spinner's label is the name. */}
            <span
              aria-hidden="true"
              className="invisible inline-flex items-center justify-center gap-2"
            >
              {children}
            </span>
            <Spinner
              variant="compact"
              label={loadingLabel}
              className="absolute inset-0 justify-center"
            />
          </>
        ) : (
          children
        )}

        {withArrow && (
          <span
            aria-hidden="true"
            className={cn(
              "transition-transform duration-300 group-hover:translate-x-1",
              loading && "invisible",
            )}
          >
            →
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
