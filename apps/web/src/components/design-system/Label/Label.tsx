"use client";

/**
 * Label Component
 * Form field label with KCVV design system styling
 */

import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * Mark the associated field as required — appends a red asterisk
   * @default false
   */
  required?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Label component for form fields.
 *
 * @example
 * ```tsx
 * <Label htmlFor="email" required>E-mailadres</Label>
 * <Input id="email" type="email" />
 * ```
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ required = false, className, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-kcvv-gray-blue mb-1.5 block text-sm font-semibold",
          className,
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="text-kcvv-alert ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
    );
  },
);

Label.displayName = "Label";
