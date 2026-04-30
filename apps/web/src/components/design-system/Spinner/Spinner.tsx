/**
 * Spinner — scarf barber-pole + compact dot pulse.
 *
 * Direction D ("Paper chrome, ink emphasis") locked at the Phase 2 Track B
 * design checkpoint (2026-04-30). Source-of-record:
 * docs/design/mockups/phase-2-track-b/option-d-paper-chrome-ink-emphasis.html.
 *
 * Variants:
 *  - primary   — jersey · cream · ink · cream stripes (default on cream)
 *  - secondary — ink · cream · ink-muted · cream stripes (non-brand)
 *  - white     — cream · ink · jersey-bright · ink stripes (dark interlude)
 *  - compact   — three jersey-deep dots pulsing in sequence (inline)
 *
 * Sizes (sm/md/lg/xl) apply only to scarf variants and resolve to fixed pixel
 * dimensions per the design contract. Compact has a single canonical inline
 * form. Animations honour `prefers-reduced-motion` via the global CSS rule.
 */

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type SpinnerSize = "sm" | "md" | "lg" | "xl";
export type SpinnerVariant = "primary" | "secondary" | "white" | "compact";

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Size of the spinner. Applies only to scarf variants
   * (primary / secondary / white). Ignored for compact.
   * @default 'md'
   */
  size?: SpinnerSize;
  /**
   * Visual variant.
   * @default 'primary'
   */
  variant?: SpinnerVariant;
  /**
   * Accessible label for screen readers.
   * @default 'Loading...'
   */
  label?: string;
  /**
   * Additional CSS classes applied to the wrapper.
   */
  className?: string;
}

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
    if (variant === "compact") {
      return (
        <div
          ref={ref}
          role="status"
          aria-label={label}
          className={cn("inline-flex items-center", className)}
          {...props}
        >
          <span className="kcvv-spinner-pulse" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="sr-only">{label}</span>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={cn("inline-flex items-center justify-center", className)}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            "kcvv-spinner-scarf",
            `kcvv-spinner-scarf--${variant}`,
            `kcvv-spinner-scarf--${size}`,
          )}
        />
        <span className="sr-only">{label}</span>
      </div>
    );
  },
);

Spinner.displayName = "Spinner";

export interface FullPageSpinnerProps {
  /**
   * Accessible label for screen readers.
   * @default 'Loading page...'
   */
  label?: string;
  /**
   * Size of the spinner.
   * @default 'xl'
   */
  size?: SpinnerSize;
}

export const FullPageSpinner = ({
  label = "Loading page...",
  size = "xl",
}: FullPageSpinnerProps) => {
  return (
    <div className="bg-cream/85 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <Spinner size={size} label={label} />
    </div>
  );
};

FullPageSpinner.displayName = "FullPageSpinner";
