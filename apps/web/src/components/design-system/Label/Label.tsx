"use client";

/**
 * Label — Phase 2.A.4 form atom (Direction C — paper-card emphasis).
 *
 * Bold ink label above a field. Required state appends a `*` in
 * `--color-alert`. Optional state appends a mono-caps "OPTIONEEL" pill
 * (`border border-ink/30 px-1.5 py-0.5 text-[10px] tracking-wide`,
 * sharp corners). `required` and `optional` are mutually exclusive —
 * `required` wins if both are passed.
 */

import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Append a red `*` to mark the associated field as required. */
  required?: boolean;
  /** Append an "OPTIONEEL" mono-caps pill — ignored when `required`. */
  optional?: boolean;
  className?: string;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { required = false, optional = false, className, children, ...props },
  ref,
) {
  return (
    <label
      ref={ref}
      className={cn("text-ink mb-2 block text-sm font-semibold", className)}
      {...props}
    >
      {children}
      {required && (
        <span className="text-alert ml-1" aria-hidden="true">
          *
        </span>
      )}
      {!required && optional && (
        <span
          className={cn(
            "border-ink/30 text-ink/60 ml-2 inline-block border px-1.5 py-0.5",
            "align-middle font-mono text-[10px] leading-none tracking-wide uppercase",
          )}
          aria-hidden="true"
        >
          Optioneel
        </span>
      )}
    </label>
  );
});
