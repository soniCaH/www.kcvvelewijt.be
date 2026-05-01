"use client";

/**
 * Textarea — Phase 2.A.4 form atom (Direction C — paper-card emphasis).
 *
 * Implements the same eight-state chrome machine as `<Input>` and
 * `<Select>` (`_internal/fieldChrome.ts`) plus a vertically-resizable
 * textarea body. When `maxLength` is set and the parent is controlled
 * (`value`), the field renders a `<TextareaCounter>` in the bottom-right
 * corner — color flips to `text-alert` when the typed length exceeds
 * `maxLength`. Counter is rendered against the field surface via a
 * `relative` wrapper, not absolutely against the page.
 */

import {
  forwardRef,
  useId,
  type TextareaHTMLAttributes,
  type ReactNode,
} from "react";
import { AlertBadge } from "@/components/design-system/Alert";
import { TextareaCounter } from "@/components/design-system/TextareaCounter";
import { cn } from "@/lib/utils/cn";
import { fieldChrome } from "../_internal/fieldChrome";

export type TextareaResize = "none" | "vertical" | "both";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Error message — flips chrome to alert and renders an `<AlertBadge>` below. */
  error?: string;
  /** Hint text rendered below when no error. */
  hint?: string;
  /**
   * Resize behaviour.
   * @default 'vertical'
   */
  resize?: TextareaResize;
  className?: string;
}

const resizeClass: Record<TextareaResize, string> = {
  none: "resize-none",
  vertical: "resize-y",
  both: "resize",
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      error,
      hint,
      resize = "vertical",
      className,
      disabled,
      placeholder,
      maxLength,
      value,
      defaultValue,
      ...props
    },
    ref,
  ) {
    const helperId = useId();
    const hasHelper = !!(error || hint);

    // Only render the live counter when the parent controls the value
    // (`value` defined) AND a `maxLength` is set. Uncontrolled textareas
    // would need a ref-based subscription to keep the counter in sync;
    // that's out of scope for the atom — the parent form keeps state.
    const showCounter =
      typeof maxLength === "number" && typeof value === "string";

    const effectivePlaceholder = placeholder ?? " ";

    const counter: ReactNode = showCounter ? (
      <TextareaCounter current={(value as string).length} max={maxLength} />
    ) : null;

    return (
      <div className="w-full">
        <div className="relative">
          <textarea
            ref={ref}
            disabled={disabled}
            placeholder={effectivePlaceholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={hasHelper ? helperId : undefined}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            className={cn(
              fieldChrome(!!error),
              "px-4 py-2.5 text-base",
              showCounter && "pb-7",
              resizeClass[resize],
              className,
            )}
            {...props}
          />
          {counter}
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
