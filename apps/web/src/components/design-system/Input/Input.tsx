"use client";

/**
 * Input — Phase 2.A.4 form atom (Direction C — paper-card emphasis).
 *
 * Implements the eight-state field machine documented in
 * `apps/web/src/components/design-system/_internal/fieldChrome.ts` and
 * PRD §6.3. Sharp corners, 2px borders with three ink weights, paper-soft
 * resting shadow, ink-press focus.
 */

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { AlertBadge } from "@/components/design-system/Alert";
import { cn } from "@/lib/utils/cn";
import { fieldChrome } from "../_internal/fieldChrome";

export type InputSize = "sm" | "md" | "lg";

const sizeClasses: Record<InputSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-base",
  lg: "h-12 px-5 text-lg",
};

const leadingPadding: Record<InputSize, string> = {
  sm: "pl-9",
  md: "pl-11",
  lg: "pl-13",
};

const trailingPadding: Record<InputSize, string> = {
  sm: "pr-9",
  md: "pr-11",
  lg: "pr-13",
};

const iconWrap: Record<InputSize, string> = {
  sm: "left-2.5 [&>*]:w-3.5 [&>*]:h-3.5",
  md: "left-3 [&>*]:w-4 [&>*]:h-4",
  lg: "left-4 [&>*]:w-5 [&>*]:h-5",
};

const trailingIconWrap: Record<InputSize, string> = {
  sm: "right-2.5 [&>*]:w-3.5 [&>*]:h-3.5",
  md: "right-3 [&>*]:w-4 [&>*]:h-4",
  lg: "right-4 [&>*]:w-5 [&>*]:h-5",
};

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  /** @default 'md' */
  size?: InputSize;
  /** Error message — flips chrome to alert and renders an `<AlertBadge>` below. */
  error?: string;
  /** Hint text rendered below when no error. */
  hint?: string;
  /** Optional leading icon (left side, vertically centered). */
  leadingIcon?: ReactNode;
  /** Optional trailing icon (right side, vertically centered). */
  trailingIcon?: ReactNode;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = "md",
    error,
    hint,
    leadingIcon,
    trailingIcon,
    className,
    disabled,
    placeholder,
    ...props
  },
  ref,
) {
  const helperId = useId();
  const hasHelper = !!(error || hint);

  // The field-chrome state machine relies on `:placeholder-shown` to
  // detect "filled". A non-empty placeholder is therefore required for
  // the filled-anchor border to engage; default to a single space when
  // the consumer omits one. (Visible placeholder still wins when set.)
  const effectivePlaceholder = placeholder ?? " ";

  return (
    <div className="w-full">
      <div className="relative">
        {leadingIcon && (
          <div
            className={cn(
              "text-ink/60 pointer-events-none absolute top-1/2 z-10 -translate-y-1/2",
              iconWrap[size],
            )}
          >
            {leadingIcon}
          </div>
        )}

        <input
          ref={ref}
          {...props}
          placeholder={effectivePlaceholder}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasHelper ? helperId : undefined}
          className={cn(
            fieldChrome(!!error),
            sizeClasses[size],
            leadingIcon && leadingPadding[size],
            trailingIcon && trailingPadding[size],
            className,
          )}
        />

        {trailingIcon && (
          <div
            className={cn(
              "text-ink/60 pointer-events-none absolute top-1/2 z-10 -translate-y-1/2",
              trailingIconWrap[size],
            )}
          >
            {trailingIcon}
          </div>
        )}
      </div>

      {error && (
        <AlertBadge variant="error" size="sm" id={helperId} className="mt-2">
          {error}
        </AlertBadge>
      )}
      {!error && hint && (
        <p id={helperId} className="font-body text-ink/60 mt-2 text-sm italic">
          {hint}
        </p>
      )}
    </div>
  );
});
