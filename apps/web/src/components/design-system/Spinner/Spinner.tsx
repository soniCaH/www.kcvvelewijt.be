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

import { forwardRef, type HTMLAttributes, type Ref } from "react";
import { cn } from "@/lib/utils/cn";

export type SpinnerSize = "sm" | "md" | "lg" | "xl";
export type SpinnerVariant = "primary" | "secondary" | "white" | "compact";

export interface SpinnerProps extends HTMLAttributes<HTMLElement> {
  /**
   * Size of the spinner. Applies only to scarf variants
   * (primary / secondary / white). Ignored for compact.
   * @default 'md'
   */
  size?: SpinnerSize;
  /**
   * Visual variant. Defaults to the dots — the scarf (`'primary'`) is
   * reserved for search and must be requested explicitly (Waiting-Device
   * Rule, DESIGN.md → Motion).
   * @default 'compact'
   */
  variant?: SpinnerVariant;
  /**
   * Accessible label for screen readers.
   * @default 'Laden…'
   */
  label?: string;
  /**
   * Additional CSS classes applied to the wrapper.
   */
  className?: string;
}

export const Spinner = forwardRef<HTMLElement, SpinnerProps>(
  (
    { size = "md", variant = "compact", label = "Laden…", className, ...props },
    ref,
  ) => {
    if (variant === "compact") {
      // A `span`, not a `div`: the dots ride inside paragraphs and anchors
      // (`LinkPendingDots`, #3386), where a block-level root is a DOM-nesting
      // error.
      return (
        <span
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
        </span>
      );
    }

    return (
      <div
        ref={ref as Ref<HTMLDivElement>}
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
