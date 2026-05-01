"use client";

/**
 * Select — Phase 2.A.4 form atom (Direction C — paper-card emphasis).
 *
 * Native `<select>` styled with the eight-state field chrome from
 * `_internal/fieldChrome.ts` plus a Phosphor `CaretDown` (fill) chevron
 * absolutely positioned inside the press wrapper so the chevron travels
 * with the surface on hover/focus translate.
 *
 * The native dropdown menu cannot be styled (OS-rendered) — that's
 * deferred to a future combobox primitive (Phase 5).
 */

import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { AlertBadge } from "@/components/design-system/Alert";
import { CaretDown } from "@/lib/icons.redesign";
import { cn } from "@/lib/utils/cn";
import { fieldChrome } from "../_internal/fieldChrome";

export type SelectSize = "sm" | "md" | "lg";

const sizeClasses: Record<SelectSize, string> = {
  sm: "h-8 pl-3 pr-9 text-sm",
  md: "h-10 pl-4 pr-11 text-base",
  lg: "h-12 pl-5 pr-13 text-lg",
};

const iconPosition: Record<SelectSize, string> = {
  sm: "right-2.5",
  md: "right-3",
  lg: "right-4",
};

const iconPx: Record<SelectSize, number> = { sm: 14, md: 16, lg: 18 };

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> {
  /** @default 'md' */
  size?: SelectSize;
  /** Error message — flips chrome to alert and renders an `<AlertBadge>` below. */
  error?: string;
  /** Hint text rendered below when no error. */
  hint?: string;
  /** Placeholder option text — rendered as the first disabled option. */
  placeholder?: string;
  className?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      size = "md",
      error,
      hint,
      placeholder,
      className,
      disabled,
      children,
      value,
      defaultValue,
      ...props
    },
    ref,
  ) {
    const helperId = useId();
    const hasHelper = !!(error || hint);

    return (
      <div className="w-full">
        <div className="relative">
          <select
            ref={ref}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={hasHelper ? helperId : undefined}
            value={value}
            defaultValue={
              defaultValue ??
              (value === undefined && placeholder ? "" : undefined)
            }
            data-placeholder={
              placeholder &&
              (value === "" || (value === undefined && !defaultValue))
                ? "true"
                : undefined
            }
            className={cn(
              fieldChrome(!!error),
              "cursor-pointer appearance-none pr-10",
              // Filled-anchor for native select: when the value is the
              // empty-string placeholder, treat it as "empty" — the
              // placeholder option keeps the field at idle ink/30 until
              // the user selects a real option.
              "[&[data-placeholder=true]:not(:focus)]:border-ink/30",
              "[&:not([data-placeholder=true]):not(:focus)]:border-ink/60",
              // Placeholder text dim
              "[&[data-placeholder=true]]:text-ink/40",
              sizeClasses[size],
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children}
          </select>

          <div
            className={cn(
              "text-ink pointer-events-none absolute top-1/2 -translate-y-1/2",
              iconPosition[size],
            )}
          >
            <CaretDown size={iconPx[size]} aria-hidden="true" />
          </div>
        </div>

        {error && (
          <AlertBadge variant="error" size="sm" id={helperId} className="mt-2">
            {error}
          </AlertBadge>
        )}
        {!error && hint && (
          <p
            id={helperId}
            className="font-body text-ink/60 mt-2 text-sm italic"
          >
            {hint}
          </p>
        )}
      </div>
    );
  },
);
