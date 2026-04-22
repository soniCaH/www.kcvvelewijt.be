"use client";

/**
 * Textarea Component
 * Multi-line text input with KCVV design system styling
 */

import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type TextareaResize = "none" | "vertical" | "both";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Error message — also applies error border styling
   */
  error?: string;
  /**
   * Hint text shown below when there is no error
   */
  hint?: string;
  /**
   * Resize behaviour
   * @default 'vertical'
   */
  resize?: TextareaResize;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Textarea component with KCVV design system styling.
 *
 * @example
 * ```tsx
 * <Textarea placeholder="Beschrijf je vraag..." rows={4} />
 * <Textarea error="Dit veld is verplicht." />
 * ```
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { error, hint, resize = "vertical", className, disabled, ...props },
    ref,
  ) => {
    const helperId = useId();
    const hasHelper = !!(error || hint);

    const resizeClass: Record<TextareaResize, string> = {
      none: "resize-none",
      vertical: "resize-y",
      both: "resize",
    };

    return (
      <div className="w-full">
        <textarea
          ref={ref}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasHelper ? helperId : undefined}
          className={cn(
            // Base
            "font-body w-full rounded-[0.25em] border bg-white",
            "px-4 py-2.5 text-base",
            "text-kcvv-gray-dark placeholder:text-foundation-gray-dark",
            "transition-all duration-200",
            "focus:ring-2 focus:ring-offset-0 focus:outline-none",

            // Default border + focus
            !error &&
              "border-foundation-gray focus:border-kcvv-green-bright focus:ring-kcvv-green-bright/20",

            // Error state
            error &&
              "border-kcvv-alert focus:border-kcvv-alert focus:ring-kcvv-alert/20",

            // Disabled
            "disabled:bg-foundation-gray-light disabled:cursor-not-allowed disabled:opacity-50",

            // Resize
            resizeClass[resize],

            className,
          )}
          {...props}
        />

        {error && (
          <p id={helperId} className="text-kcvv-alert mt-1.5 text-sm">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={helperId} className="text-foundation-gray-dark mt-1.5 text-sm">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
